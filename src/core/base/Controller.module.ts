/**
 * @file Controller.module.ts
 * @module core/base
 *
 * @description
 * Базовый абстрактный класс для gRPC-контроллеров с поддержкой middleware
 * до и после выполнения контроллера. Служит фундаментом для системных
 * и прикладных контроллеров.
 *
 * @extends BaseModule
 *
 * @see BaseModule
 * @see EModuleType
 *
 * @example
 * class SomeCustomController extends ControllerModule {
 *   constructor() {
 *     super('SomeController');
 *   }
 * }
 */

/**
 * ! my imports
 */
import { BaseModule } from '@core/base/Base.module';
import { EModuleType } from '@core/types';

/**
 * Абстрактный класс, описывающий базовые свойства всех контроллеров: тип и имя контроллера.
 * Используется как фундамент для лог-контекста и архитектурного разграничения.
 */
export abstract class ControllerModule extends BaseModule {
	/**
	 * @param moduleName Название контроллера (для лог-контекста)
	 */
	protected constructor(moduleName: string) {
		super(EModuleType.CONTROLLER, moduleName);
	}
}
