/**
 * @file middleware.interface.ts
 * @module core/types/router
 *
 * @description
 * Базовые типы для middleware-цепочки gRPC-роутера.
 * Используются как контракт для реализации системных и прикладных middleware.
 */

/**
 * ! lib imports
 */
import { IRpcContext } from '@core/types/router/Routers.interface';

/**
 * Функция продолжения цепочки middleware.
 * Должна быть вызвана ровно один раз внутри middleware.
 */
export type TMiddlewareNext = () => Promise<void>;

/**
 * Сигнатура обработчика middleware.
 * @template Req Тип входящего запроса
 * @template Res Тип исходящего ответа
 */
export type TMiddlewareHandle<Req = unknown, Res = unknown> = (
	ctx: IRpcContext<Req, Res>,
	next: TMiddlewareNext
) => Promise<void>;

/**
 * Контракт для модулей-middleware, если требуется описать через интерфейс.
 */
export interface IMiddlewareModule<Req = unknown, Res = unknown> {
	/**
	 * Основной обработчик цепочки.
	 * Реализация обязана либо вызвать `next()`, либо завершить обработку (например, выбросом ошибки).
	 */
	handle: TMiddlewareHandle<Req, Res>;
}
