/**
 * @file BaseModule.ts
 * @module core/base
 *
 * @description
 * Абстрактный базовый класс для модулей приложения, предоставляющий:
 * - Логгирование с автоматической привязкой к модулю;
 * - Стандартизированный интерфейс для отладки и трассировки;
 * - Явное указание типа модуля (например, SYSTEM, UTILITY, FEATURE).
 *
 * Используется для наследования другими модулями в рамках `CoreModule`.
 *
 * @extends CoreModule
 *
 * @see Logger
 * @see ConsolePrintOptions
 * @see ELogLevel
 * @see EModuleType
 * @see ILog
 * @see LogOptions
 * @see CoreModule
 */

/**
 * ! my imports
 */
import { Logger } from '@core/logger';
import {
	ConsolePrintOptions,
	ELogLevel,
	EModuleType,
	ILog,
	LogOptions
} from '@core/types';
import { CoreModule } from '@core/base/Core.module';

/**
 * Абстрактный класс, описывающий базовые свойства всех модулей:
 * тип и имя модуля. Используется как фундамент для логгирования и архитектурного разграничения.
 */
export abstract class BaseModule extends CoreModule {
	/**
	 * Базовый конструктор Core-модуля.
	 *
	 * @param moduleType - Тип модуля
	 * @param moduleName - Название модуля
	 */
	protected constructor(moduleType: EModuleType, moduleName: string) {
		super(moduleType, moduleName);
	}

	/**
	 * Возвращает название модуля
	 *
	 * @returns {string} Название модуля
	 */
	public getModuleName(): string {
		return this.moduleName;
	}

	/**
	 * Возвращает тип модуля.
	 * Используется для внешней идентификации модуля или фильтрации по типу.
	 *
	 * @returns {EModuleType} Тип модуля
	 */
	public getModuleType(): EModuleType {
		return this.moduleType;
	}

	/**
	 * ? === === === LOGGER METHODS === === ===
	 */

	/**
	 * Универсальный метод логирования с автоматической привязкой к модулю.
	 */
	protected log(
		level: ELogLevel,
		data: Omit<ILog, 'level' | 'createdAt' | 'moduleName' | 'moduleType'>,
		ops?: { log?: LogOptions; console?: ConsolePrintOptions }
	): void {
		Logger.fromModule(this, level, data, ops);
	}

	/** Лог уровня DEBUG */
	protected debug(
		message: string,
		extra?: Partial<
			Omit<
				ILog,
				'message' | 'level' | 'createdAt' | 'moduleName' | 'moduleType'
			>
		>,
		ops?: { log?: LogOptions; console?: ConsolePrintOptions }
	): void {
		this.log(ELogLevel.DEBUG, { message, ...extra }, ops);
	}

	/** Лог уровня INFO (по умолчанию не сохраняется в файл) */
	protected info(
		message: string,
		extra?: Partial<
			Omit<
				ILog,
				'message' | 'level' | 'createdAt' | 'moduleName' | 'moduleType'
			>
		>,
		ops?: { log?: LogOptions; console?: ConsolePrintOptions }
	): void {
		const save = ops?.log?.save ?? false; // по умолчанию не сохраняем
		this.log(ELogLevel.INFO, { message, ...extra }, { ...ops, log: { save } });
	}

	/** Лог уровня WARN */
	protected warn(
		message: string,
		extra?: Partial<
			Omit<
				ILog,
				'message' | 'level' | 'createdAt' | 'moduleName' | 'moduleType'
			>
		>,
		ops?: { log?: LogOptions; console?: ConsolePrintOptions }
	): void {
		this.log(ELogLevel.WARN, { message, ...extra }, ops);
	}

	/** Лог уровня ERROR */
	protected error(
		message: string,
		extra?: Partial<
			Omit<
				ILog,
				'message' | 'level' | 'createdAt' | 'moduleName' | 'moduleType'
			>
		>,
		ops?: { log?: LogOptions; console?: ConsolePrintOptions }
	): void {
		this.log(ELogLevel.ERROR, { message, ...extra }, ops);
	}

	/** Лог уровня FATAL */
	protected fatal(
		message: string,
		extra?: Partial<
			Omit<
				ILog,
				'message' | 'level' | 'createdAt' | 'moduleName' | 'moduleType'
			>
		>,
		ops?: { log?: LogOptions; console?: ConsolePrintOptions }
	): void {
		this.log(ELogLevel.FATAL, { message, ...extra }, ops);
	}
}
