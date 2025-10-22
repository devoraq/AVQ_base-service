/**
 * @file Service.module.ts
 * @module core/base
 *
 * @description
 * Базовый абстрактный класс для всех сервисов приложения.
 * Представляет собой фундамент, от которого наследуется, как системные, так и прикладные сервисы.
 *
 * Основные задачи:
 * - Хранение типа и имени сервиса
 * - Предоставление лог-контекста (используется в логгере)
 *
 * @extends BaseModule
 *
 * @see BaseModule
 * @see EModuleType
 *
 * @example
 * class SomeCustomService extends ServiceModule {
 *   constructor() {
 *     super('SomeService');
 *   }
 * }
 */

/**
 * ! my imports
 */
import { BaseModule } from '@core/base/Base.module';
import { EModuleType } from '@core/types';

/**
 * Абстрактный класс, описывающий базовые свойства всех сервисов: тип и имя сервиса.
 * Используется как фундамент для логгирования и архитектурного разграничения.
 */
export abstract class ServiceModule extends BaseModule {
	/**
	 * Базовый конструктор Service-модуля.
	 *
	 * @param moduleName - Название сервиса
	 */
	protected constructor(moduleName: string) {
		super(EModuleType.SERVICE, moduleName);
	}
}
