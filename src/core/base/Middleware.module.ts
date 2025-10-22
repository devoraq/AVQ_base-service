/**
 * @file Middleware.module.ts
 * @module core/base
 *
 * @description
 * Абстрактный базовый класс для всех middleware-прослоек gRPC-роутера.
 * Предоставляет единый контракт `handle(ctx, next)` и интегрируется в систему модулей через BaseModule.
 *
 * Основные задачи:
 * - Единый интерфейс для системных/прикладных middleware
 * - Интеграция с logger/метриками через контекст модуля
 * - Возможность типизации Req/Res на уровне наследников
 *
 * @extends BaseModule
 *
 * @see BaseModule
 * @see EModuleType
 */

/**
 * ! my imports
 */
import { BaseModule } from '@core/base/Base.module';
import { EModuleType, IMiddlewareModule, TMiddlewareHandle } from '@core/types';

/**
 * Абстрактный модуль-мидлвара.
 * Наследники реализуют метод `handle`, который будет вызван в цепочке роутера.
 */
export abstract class MiddlewareModule<Req = unknown, Res = unknown>
	extends BaseModule
	implements IMiddlewareModule<Req, Res>
{
	/**
	 * Базовый конструктор Middleware-модуля.
	 *
	 * @param moduleName - Название middleware
	 */
	protected constructor(moduleName: string) {
		super(EModuleType.MIDDLEWARE, moduleName);
	}

	/**
	 * Главный обработчик middleware.
	 * Должен либо вызвать `next()`, чтобы передать управление дальше по цепочке,
	 * либо прервать выполнение, выбросив исключение (будет обработано роутером).
	 */
	abstract handle: TMiddlewareHandle<Req, Res>;
}
