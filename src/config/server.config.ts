/**
 * @file server.config.ts
 * @module config
 */

/**
 * @description
 * Конфигурация логгера.
 *
 * @property {string} HOST - Хост сервера.
 * @property {number} PORT - Порт сервера.
 * @property {number} DEADLINE_MS - Таймаут для gRPC-запросов (в миллисекундах).
 */
export const SERVER_CONFIG = {
	/** Хост сервера. */
	HOST: Bun.env.HOST ?? '127.0.0.1',
	/** Порт сервера. */
	PORT: Number(Bun.env.PORT ?? 50051),
	/** Таймаут для gRPC-запросов (в миллисекундах). */
	DEADLINE_MS: Number(Bun.env.DEADLINE_MS ?? 2000),
	/** Graceful shutdown timeout (in milliseconds). */
	GRACEFUL_MS: Number(Bun.env.GRACEFUL_MS ?? 2000)
};
