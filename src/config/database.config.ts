/**
 * @file database.config.ts
 * @module config
 */

/**
 * @description
 * Конфигурация базы данных.
 *
 * @property {string} URL - URL подключения к базе данных.
 * @property {string} DB_NAME - Название базы данных.
 * @property {string} LOGGING - Режим логирования запросов к базе данных.
 * @property {Array<string>} ENTITIES - Сущности TypeORM.
 * @property {boolean} SYNCHRONIZE - Режим синхронизации с базой данных.
 * @property {number} POOL_SIZE - Пул соединений (pg): max — это поле в extra драйвера pg.
 * @property {DatabaseRetryOptions} CONNECT - Конфигурация подключения к базе данных.
 * @property {number} CONNECT.maxAttempts - Макс. попыток подключения (0 = бесконечно).
 * @property {number} CONNECT.baseDelayMs - Стартовая задержка между попытками (мс).
 * @property {number} CONNECT.factor - Множитель экспоненциальной паузы.
 * @property {number} CONNECT.maxDelayMs - Верхняя граница паузы (мс).
 */
export const DATABASE_CONFIG = {
	/** URL подключения к базе данных. */
	URL: Bun.env.DATABASE_URL || 'postgres://postgres:pass@localhost:5432/avq',
	/** Название базы данных. */
	DB_NAME: Bun.env.DATABASE_NAME || 'avq',
	/** Режим логирования запросов к базе данных. */
	LOGGING: Bun.env.DB_LOG === '1',
	/** Сущности TypeORM. */
	ENTITIES: [
		// сюда — ваши сущности TypeORM
	],
	/** Режим синхронизации с базой данных. */
	SYNCHRONIZE: Bun.env.NODE_ENV !== 'production', // только dev!
	/** Пул соединений (pg): max — это поле в extra драйвера pg */
	POOL_SIZE: Number(Bun.env.DB_POOL_SIZE || 10),
	/** Конфигурация подключения к базе данных. */
	CONNECT: {
		/** Макс. попыток подключения (0 = бесконечно) */
		MAX_ATTEMPTS: Number(Bun.env.DATABASE_MAX_ATTEMPTS) || 5,
		/** Стартовая задержка между попытками (мс) */
		BASE_DELAY_MS: Number(Bun.env.DATABASE_BASE_DELAY_MS) || 250,
		/** Множитель экспоненциальной паузы */
		FACTOR: Number(Bun.env.DATABASE_FACTOR) || 2,
		/** Верхняя граница паузы (мс) */
		MAX_DELAY_MS: Number(Bun.env.DATABASE_MAX_DELAY_MS) || 5000
	}
};
