/**
 * @file Router.module.ts
 * @module core/base
 *
 * @description
 * Базовый абстрактный класс для gRPC-роутеров:
 * - поддержка before/after middleware,
 * - регистрация одиночных методов,
 * - монтирование контроллеров с множеством методов,
 * - адаптация в gRPC unary handlers и сборка целого service-impl.
 *
 * Результат контроллера кладётся в `ctx.state.__response`, доступен для after-middleware.
 */

/**
 * ! lib imports
 */
import {
	type handleUnaryCall,
	type ServiceError,
	Metadata,
	status as GrpcStatus,
	type UntypedServiceImplementation
} from '@grpc/grpc-js';

/**
 * ! my imports
 */
import { BaseModule, MiddlewareModule } from '@core/base';
import {
	EModuleType,
	type IRpcContext,
	type TMiddlewareHandle,
	type IMiddlewareModule,
	type TControllerMethod
} from '@core/types';

/** Фаза исполнения middleware. */
type TMiddlewarePhase = 'before' | 'after';

/** Допустимые типы входной мидлвары. */
type TAcceptableMiddleware<Req = unknown, Res = unknown> =
	| MiddlewareModule<Req, Res>
	| IMiddlewareModule<Req, Res>
	| TMiddlewareHandle<Req, Res>;

/** Нормализация мидлвары к единой сигнатуре handle(ctx, next). */
function normalizeMiddleware<Req, Res>(
	mw: TAcceptableMiddleware<Req, Res>
): TMiddlewareHandle<Req, Res> {
	if (typeof mw === 'function') return mw;
	return (mw as IMiddlewareModule<Req, Res>).handle.bind(mw);
}

/**
 * Абстрактный класс gRPC-роутера.
 */
export abstract class RouterModule extends BaseModule {
	/** Полное имя сервиса (package.Service) для логов/контекста. */
	readonly prefix: string;

	private beforeMiddlewares: Array<TMiddlewareHandle> = [];
	private afterMiddlewares: Array<TMiddlewareHandle> = [];

	/** Реестр методов: имя → контроллер */
	private routes = new Map<string, TControllerMethod>();

	/**
	 * @param moduleName Имя роутера (для лог-контекста)
	 * @param prefix Полное имя сервиса (например, "user.UserService")
	 */
	protected constructor(moduleName: string, prefix: string) {
		super(EModuleType.ROUTER, moduleName);
		this.prefix = prefix;
	}

	/** Зарегистрировать middleware (по умолчанию в фазе 'before'). */
	public use<Req, Res>(
		mw: TAcceptableMiddleware<Req, Res>,
		phase: TMiddlewarePhase = 'before'
	): this {
		const fn = normalizeMiddleware(mw as TAcceptableMiddleware);
		if (phase === 'after') this.afterMiddlewares.push(fn);
		else this.beforeMiddlewares.push(fn);
		return this;
	}

	public useBefore<Req, Res>(mw: TAcceptableMiddleware<Req, Res>): this {
		return this.use(mw, 'before');
	}

	public useAfter<Req, Res>(mw: TAcceptableMiddleware<Req, Res>): this {
		return this.use(mw, 'after');
	}

	/** Зарегистрировать одиночный метод контроллера. */
	public handle<Req, Res>(
		methodName: string,
		controller: TControllerMethod<Req, Res>
	): this {
		this.routes.set(methodName, controller as TControllerMethod);
		return this;
	}

	/** Список зарегистрированных имён методов. */
	public listMethods(): string[] {
		return Array.from(this.routes.keys());
	}

	/** Создать gRPC unary handler для конкретного метода. */
	public toUnaryHandler<Req, Res>(
		methodName: string
	): handleUnaryCall<Req, Res> {
		const controller = this.routes.get(methodName);

		if (!controller) {
			this.error(`No controller registered for ${this.prefix}/${methodName}`, {
				details: { service: this.prefix, method: methodName }
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
				if (call.cancelled) {
					const err = Object.assign(new Error('Cancelled'), {
						code: GrpcStatus.CANCELLED
					});
					callback(err, null as unknown as Res);
					return;
				}

				if (this.beforeMiddlewares.length) {
					await runChain(
						this.beforeMiddlewares as TMiddlewareHandle<Req, Res>[]
					);
				}

				const result = await (controller as TControllerMethod<Req, Res>)(ctx);

				(ctx.state as any).__response = result;

				if (this.afterMiddlewares.length) {
					await runChain(
						this.afterMiddlewares as TMiddlewareHandle<Req, Res>[]
					);
				}

				callback(null, result);
			} catch (e: any) {
				const code =
					Number.isInteger(e?.code) && e.code >= 0
						? e.code
						: GrpcStatus.UNKNOWN;
				const err = Object.assign(new Error(e?.message ?? 'Internal error'), {
					code,
					details: e?.details
				});
				callback(err, null as unknown as Res);
			}
		}) as handleUnaryCall<Req, Res>;
	}

	/**
	 * Собрать реализацию gRPC-сервиса для всех зарегистрированных методов.
	 * Возвращает объект { methodName: toUnaryHandler(methodName), ... }.
	 */
	public asServiceImpl(): UntypedServiceImplementation {
		const impl: Record<string, unknown> = {};
		for (const name of this.routes.keys()) {
			impl[name] = this.toUnaryHandler(name);
		}
		return impl as UntypedServiceImplementation;
	}
}
