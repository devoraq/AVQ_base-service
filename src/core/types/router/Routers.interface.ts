/**
 * @file routers.interface.ts
 * @module core/types/router
 *
 * @description
 * Интерфейс, описывающий контекст RPC-запроса.
 */

/**
 * ! lib imports
 */
import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

export interface IRpcContext<Req = unknown, Res = unknown> {
	/** исходный gRPC вызов */
	call: ServerUnaryCall<Req, Res>;
	/** метаданные запроса */
	metadata: Metadata;
	/** полное имя сервиса, например: "user.UserService" */
	service: string;
	/** имя метода, например: "GetUser" */
	method: string;
	/** удобное место под requestId, таймеры и т.п. */
	state: Record<string, unknown>;
	/**
	 * метаданные ответа, которые будут отправлены клиенту.
	 * Например, для установки HTTP-статус кода.
	 */
	out?: { headers?: Metadata; trailers?: Metadata };
}

export type TRpcMiddleware<Req = unknown, Res = unknown> = (
	ctx: IRpcContext<Req, Res>,
	next: () => Promise<void>
) => Promise<void>;

export type TRpcController<Req = unknown, Res = unknown> = (
	ctx: IRpcContext<Req, Res>
) => Promise<Res>;
