/**
 * @file App.ts
 * @module core/app
 *
 * @description
 * Ядро приложения: управляет жизненным циклом gRPC-сервера,
 * регистрирует роутеры (сервисы) и запускает/останавливает сервер.
 *
 * Основные возможности:
 * - addRouter/addService: добавить регистрацию gRPC-сервиса
 * - initRouters: смонтировать все добавленные сервисы в сервер
 * - start/stop: запустить и корректно остановить сервер
 *
 * @extends BaseModule
 *
 * @see BaseModule
 * @see EModuleType
 */

/**
 * ! lib imports
 */
import {
	Server,
	ServerCredentials,
	type ServiceDefinition,
	type UntypedServiceImplementation
} from '@grpc/grpc-js';

/**
 * ! my imports
 */
import { BaseModule, OrmDatabaseModule } from '@core/base';
import { EModuleType } from '@core/types';
import { SERVER_CONFIG } from '@config';

/**
 * Описание регистрации gRPC-сервиса (как правило — твоего RouterModule,
 * преобразованного в { definition, impl }).
 */
export interface GrpcServiceEntry {
	/** Человекочитаемое имя для логов/диагностики */
	name: string;
	/** ServiceDefinition из ts-proto (например, UserServiceService) */
	definition: ServiceDefinition;
	/** Реализация методов (например, router.asServiceImpl()) */
	impl: UntypedServiceImplementation;
}

/**
 * Опции запуска приложения.
 */
export interface AppOptions {
	host?: string; // по умолчанию "0.0.0.0"
	port?: number; // по умолчанию 50051
	credentials?: ServerCredentials; // по умолчанию ServerCredentials.createInsecure()
	gracefulShutdownMs?: number; // таймаут мягкой остановки (по умолчанию 2000мс)
}

/**
 * Класс приложения: управляет gRPC-сервером и роутерами.
 */
export class App extends BaseModule {
	private readonly server: Server;
	private readonly services: GrpcServiceEntry[] = [];

	private readonly host: string = SERVER_CONFIG.HOST;
	private readonly port: number = SERVER_CONFIG.PORT;
	private readonly gracefulMs: number = SERVER_CONFIG.GRACEFUL_MS;
	private readonly creds: ServerCredentials;

	/**
	 * Флаг инициализации роутеров (initRouters).
	 * Устанавливается в true после успешного вызова initRouters.
	 */
	private initedRouters = false;
	/**
	 * Флаг инициализации БД (connect).
	 * Устанавливается в true после успешного вызова connect.
	 */
	private initedDatabases = false;
	/**
	 * Флаг запуска приложения (start).
	 * Устанавливается в true после успешного вызова start.
	 */
	private started = false;
	private orms: Array<OrmDatabaseModule> = [];

	public constructor(opts: AppOptions = {}) {
		super(EModuleType.SYSTEM, App.name);

		this.server = new Server();

		this.host = opts.host ?? this.host;
		this.port = opts.port ?? this.port;
		this.creds = opts.credentials ?? ServerCredentials.createInsecure();
		this.gracefulMs = opts.gracefulShutdownMs ?? this.gracefulMs;
	}

	/**
	 * Добавить регистрацию gRPC-сервиса.
	 * Обычно это пара { definition, impl }, собранная конкретным RouterModule.
	 */
	addService(entry: GrpcServiceEntry): this {
		if (this.started) {
			this.warn(
				'Service added after start — it will not be bound until next restart.',
				{
					details: { name: entry.name }
				},
				{ log: { save: true } }
			);
		}
		this.services.push(entry);
		return this;
	}

	/**
	 * Удобный алиас для добавления сервиса от роутера.
	 * @param name Имя регистрации (для логов)
	 * @param definition ServiceDefinition (из ts-proto)
	 * @param impl Реализация (обычно из router.asServiceImpl())
	 */
	addRouter(
		name: string,
		definition: ServiceDefinition,
		impl: UntypedServiceImplementation
	): this {
		return this.addService({ name, definition, impl });
	}

	/**
	 * Смонтировать все добавленные сервисы в сервер.
	 * Повторный вызов безопасен, но услуги монтируются только один раз.
	 */
	initRouters(): this {
		if (this.initedRouters) return this;

		for (const svc of this.services) {
			this.server.addService(svc.definition, svc.impl);
			this.info(`Mounted gRPC service: ${svc.name}`);
		}

		this.initedRouters = true;
		return this;
	}

	/**
	 * Добавить ORM-модуль к приложению.
	 * @param orm ORM-модуль, который будет подключаться к БД.
	 */
	addOrm(orm: OrmDatabaseModule): this {
		this.orms.push(orm);
		return this;
	}

	async initDatabases(): Promise<void> {
		if (this.initedDatabases) return;

		// Коннект ко всем БД ДО старта gRPC
		for (const orm of this.orms) {
			this.info(`Connecting to database: ${orm.getName()}`);
			await orm.connect();
			this.info(`Connected to database: ${orm.getName()}`);
		}

		this.initedDatabases = true;
	}

	/**
	 * Запустить сервер: bind + start.
	 * Если роутеры ещё не смонтированы — смонтирует автоматически.
	 */
	async start(): Promise<void> {
		if (this.started) return;

		// Монтирование роутеров ДО старта gRPC
		if (!this.initedRouters) {
			this.initRouters();
		}

		// Подключение к БД ДО старта gRPC
		if (!this.initedDatabases) {
			await this.initDatabases();
		}

		await new Promise<void>((resolve, reject) => {
			this.server.bindAsync(
				`${this.host}:${this.port}`,
				this.creds,
				(err, boundPort) => {
					if (err) return reject(err);
					this.info(`gRPC listening on ${this.host}:${boundPort}`);
					resolve();
				}
			);
		});

		this.started = true;
	}

	/**
	 * Корректная остановка сервера с таймаутом.
	 * Сначала tryShutdown, по таймауту — forceShutdown.
	 */
	async stop(): Promise<void> {
		if (!this.started) return;

		const deadline = Date.now() + this.gracefulMs;

		// Отключение от всех БД ПОСЛЕ остановки gRPC
		for (const orm of this.orms) {
			await orm.disconnect();
		}

		await new Promise<void>(resolve => {
			let done = false;

			const finish = () => {
				if (!done) {
					done = true;
					this.started = false;
					this.info('gRPC server stopped.');
					resolve();
				}
			};

			this.server.tryShutdown(err => {
				if (err)
					this.warn('tryShutdown error; forcing shutdown.', {
						details: { err: String(err) }
					});
				finish();
			});

			// таймаут на случай зависаний
			const remain = Math.max(0, deadline - Date.now());
			setTimeout(() => {
				if (done) return;
				this.warn('Graceful shutdown timed out. Forcing shutdown.');
				this.server.forceShutdown();
				finish();
			}, remain);
		});
	}

	/** Доступ к нативному серверу, если понадобится (например, для health-check сервиса). */
	getServer(): Server {
		return this.server;
	}
}
