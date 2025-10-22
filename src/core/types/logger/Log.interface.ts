/**
 * @file Logger.interface.ts
 * @module core/types/logger
 *
 * @author Dmytro Shakh
 */

/**
 * ! my imports
 */
import { EModuleType } from '@core/types/ModuleType.interface';
import { ELogLevel } from '@core/types/logger/LogLevel.interface';

/**
 * Интерфейс для описания лога
 */
export interface ILog {
	/** Основное сообщение лога */
	message: string;
	/** Уровень серьезности (debug, info, warn, error) */
	level: ELogLevel;
	/** Тип модуля (SERVICE, CONTROLLER и т.п.) */
	moduleType: EModuleType;
	/** Название модуля (например, 'UserService') */
	moduleName: string;
	/** Дата и время создания лога */
	createdAt: Date;
	/** Идентификатор запроса */
	requestId?: string;
	/** Дополнительные данные в формате ключ-значение */
	details?: Record<string, any>;
	/** Ошибка, связанная с логом */
	error?: Error | string;
}
