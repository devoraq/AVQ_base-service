/**
 * @file Orm.interface.ts
 * @module core/types/database
 *
 * @description
 * Базовые типы для ORM-модулей (без SQL-запросов на руках).
 */

export enum EOrmStatus {
	IDLE = 'IDLE',
	CONNECTING = 'CONNECTING',
	CONNECTED = 'CONNECTED',
	DISCONNECTED = 'DISCONNECTED',
	ERROR = 'ERROR'
}

export interface IOrmDatabaseModule<
	TDataSource = unknown,
	TManager = unknown,
	TRepository = unknown
> {
	/** Человекочитаемое имя подключения (для логов) */
	getName(): string;

	/** Текущий статус ORM-подключения */
	getStatus(): EOrmStatus;

	/** Установить соединение (с ретраями по желанию реализации) */
	connect(): Promise<void>;

	/** Отключиться (graceful) */
	disconnect(): Promise<void>;

	/** Быстрая проверка доступности */
	ping(): Promise<boolean>;

	/** Нативные объекты ORM */
	getDataSource(): TDataSource;
	getManager(): TManager;

	/** Получить репозиторий сущности */
	getRepository<Entity>(target: unknown): TRepository;

	/** Выполнить функцию в транзакции */
	transaction<T>(fn: (manager: TManager) => Promise<T>): Promise<T>;
}
