/**
 * @file Controller.interface.ts
 * @module core/types/controller
 *
 * @description
 * Базовые типы для контроллеров, содержащих несколько RPC-методов.
 */

/**
 * ! my imports
 */
import type { IRpcContext } from '@core/types/router';

/** Сигнатура одного RPC-метода контроллера */
export type TControllerMethod<Req = unknown, Res = unknown> = (
	ctx: IRpcContext<Req, Res>
) => Promise<Res>;
