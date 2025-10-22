/**
 * @file Router.module.ts
 * @module core/base
 *
 * @description
 * Базовый абстрактный класс для gRPC-роутеров с поддержкой middleware
 * до и после выполнения контроллера. Служит фундаментом для системных
 * и прикладных роутеров.
 *
 * Возможности:
 * - Регистрация middleware-функций и модулей (до/после запроса)
 * - Регистрация контроллеров по имени метода
 * - Адаптация в gRPC unary handler
 *
 * Примечания:
 * - Результат контроллера сохраняется в `ctx.state.__response` и доступен
 *   для post-middleware. После выполнения post-цепочки ответ отправляется клиенту.
 *
 * @extends BaseModule
 *
 * @see BaseModule
 * @see EModuleType
 *
 * @example
 * class SomeCustomRouter extends RouterModule {
 *   constructor() {
 *     super('SomeRouter');
 *   }
 * }
 */

/**
 * ! lib imports
 */
import {
	type handleUnaryCall,
	type ServiceError,
	Metadata,
	status as GrpcStatus
} from '@grpc/grpc-js';

/**
 * ! my imports
 */
import { BaseModule } from '@core/base/Base.module';
import { MiddlewareModule } from '@core/base/Middleware.module';
import {
	EModuleType,
	type IRpcContext,
	type TRpcController,
	type TMiddlewareHandle,
	type IMiddlewareModule
} from '@core/types';

/**
 * Фаза исполнения middleware.
 */
type TMiddlewarePhase = 'before' | 'after';

/**
 * Допустимый тип входной мидлвары:
 * - инстанс MiddlewareModule
 * - «сырая» функция-обработчик
 */
type TAcceptableMiddleware<Req = unknown, Res = unknown> =
	| MiddlewareModule<Req, Res>
	| IMiddlewareModule<Req, Res>
	| TMiddlewareHandle<Req, Res>;

/**
 * Нормализация мидлвары к единой сигнатуре handle(ctx, next).
 */
function normalizeMiddleware<Req, Res>(
	mw: TAcceptableMiddleware<Req, Res>
): TMiddlewareHandle<Req, Res> {
	if (typeof mw === 'function') return mw;
	// инстанс класса с полем handle
	return (mw as IMiddlewareModule<Req, Res>).handle.bind(mw);
}

/**
 * Абстрактный класс, описывающий базовые свойства всех роутеров: тип и имя роутера.
 * Используется как фундамент для логгирования и архитектурного разграничения.
 */
export abstract class RouterModule extends BaseModule {
	readonly prefix: string;

	private beforeMiddlewares: Array<TMiddlewareHandle> = [];
	private afterMiddlewares: Array<TMiddlewareHandle> = [];

	private routes = new Map<string, TRpcController>();

	/**
	 * @param moduleName Название роутера (для лог-контекста)
	 * @param prefix Полное имя сервиса (package.Service), например: "user.UserService"
	 */
	protected constructor(moduleName: string, prefix: string) {
		super(EModuleType.ROUTER, moduleName);
		this.prefix = prefix;
	}
	/**
	 * Регистрация middleware.
	 * @param mw Мидлвара (модуль или функция)
	 * @param phase Фаза исполнения: 'before' (по умолчанию) или 'after'
	 */
	public use<Req, Res>(
		mw: TAcceptableMiddleware<Req, Res>,
		phase: TMiddlewarePhase = 'before'
	): this {
		const fn = normalizeMiddleware(mw as TAcceptableMiddleware);
		if (phase === 'after') this.afterMiddlewares.push(fn);
		else this.beforeMiddlewares.push(fn);
		return this;
	}

	/**
	 * Сахар: регистрация before-middleware.
	 */
	public useBefore<Req, Res>(mw: TAcceptableMiddleware<Req, Res>): this {
		return this.use(mw, 'before');
	}

	/**
	 * Сахар: регистрация after-middleware.
	 */
	public useAfter<Req, Res>(mw: TAcceptableMiddleware<Req, Res>): this {
		return this.use(mw, 'after');
	}

	/**
	 * Регистрация контроллера для конкретного метода.
	 */
	public handle<Req, Res>(
		methodName: string,
		controller: TRpcController<Req, Res>
	): this {
		this.routes.set(methodName, controller as TRpcController);
		return this;
	}

	/**
	 * Создаёт gRPC unary handler для указанного метода.
	 */
	public toUnaryHandler<Req, Res>(
		methodName: string
	): handleUnaryCall<Req, Res> {
		const controller = this.routes.get(methodName);

		if (!controller) {
			this.error(`No controller registered for ${this.prefix}/${methodName}`, {
				details: {
					service: this.prefix,
					method: methodName
				}
			});
			throw new Error(
				`No controller registered for ${this.prefix}/${methodName}`
			);
		}

		return (async (call, callback) => {
			const ctx: IRpcContext<Req, Res> = {
				call,
				metadata: call.metadata ?? new Metadata(),
				service: this.prefix,
				method: methodName,
				state: {}
			};

			// исполняет цепочку мидлвар
			const runChain = async (chain: TMiddlewareHandle<Req, Res>[]) => {
				let idx = -1;
				const runner = async (i: number): Promise<void> => {
					if (i <= idx) throw new Error('next() called multiple times');
					idx = i;
					const fn = chain[i];
					if (fn) await fn(ctx, () => runner(i + 1));
				};
				await runner(0);
			};

			try {
				// уважать отмену до начала обработки
				if (call.cancelled) {
					const err: ServiceError = Object.assign(new Error('Cancelled'), {
						code: GrpcStatus.CANCELLED
					});
					callback(err, null as unknown as Res);
					return;
				}

				// 1) before-цепочка
				if (this.beforeMiddlewares.length) {
					await runChain(
						this.beforeMiddlewares as TMiddlewareHandle<Req, Res>[]
					);
				}

				// 2) контроллер
				const result = await (controller as TRpcController<Req, Res>)(ctx);
				// делаем доступным для after-мидлвар
				(ctx.state as any).__response = result;

				// 3) after-цепочка
				if (this.afterMiddlewares.length) {
					await runChain(
						this.afterMiddlewares as TMiddlewareHandle<Req, Res>[]
					);
				}

				// 4) успех
				callback(null, result);
			} catch (e: any) {
				const code =
					Number.isInteger(e?.code) && e.code >= 0
						? e.code
						: GrpcStatus.UNKNOWN;
				const err: ServiceError = Object.assign(
					new Error(e?.message ?? 'Internal error'),
					{
						code,
						details: e?.details
					}
				);
				callback(err, null as unknown as Res);
			}
		}) as handleUnaryCall<Req, Res>;
	}
}
