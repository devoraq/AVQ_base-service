/**
 * @file LogStored.interface.ts
 * @module core/types
 *
 * @description
 * Интерфейс лога, который хранится в файловой системе или базе данных.
 * Ключи сокращены для уменьшения объёма данных при сериализации.
 *
 * @example
 * {
 *   m: "User created successfully",
 *   lvl: "info",
 *   mt: "Service",
 *   mn: "UserService",
 *   at: "2025-10-19T10:30:00.000Z",
 *   rid: "c3a1b2",
 *   e: "ValidationError: invalid email",
 *   d: { userId: "123" }
 * }
 */
import { EModuleType } from '@core/types/ModuleType.interface';
import { ELogLevel } from '@core/types/logger/LogLevel.interface';

/**
 * Упрощённый формат лога для хранения или передачи.
 */
export interface ILogStored {
	/** Основное сообщение лога */
	m: string;
	/** Уровень серьёзности (debug, info, warn, error) */
	lvl: ELogLevel;
	/** Тип модуля (SERVICE, CONTROLLER, ...) */
	mt: EModuleType;
	/** Название модуля */
	mn: string;
	/** Время создания в миллисекундах Unix Epoch */
	at: number;
	/** Идентификатор запроса / контекста */
	rid?: string;
	/** Дополнительные данные */
	d?: Record<string, any>;
	/** Ошибка или описание исключения */
	e?: string;
}
