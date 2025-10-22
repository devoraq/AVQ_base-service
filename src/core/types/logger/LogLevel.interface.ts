/**
 * @file LogLevel.interface.ts
 * @module core/types/logger
 *
 * @author Dmytro Shakh
 */

/**
 * Уровень серьезности лога
 */
export enum ELogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
	FATAL = 'fatal'
}
