/**
 * @file Errors.classify.ts
 * @module core/error
 * @description Classify database errors
 */

/**
 * ! lib imports
 */
import type { DatabaseError } from 'pg';

/**
 * ! my imports
 */
import {
	EDbErrorKind,
	type IOrmConnectError,
	type TDbDriver
} from '@core/error/Errors.normalize';
import {
	isPgDatabaseError,
	isQueryFailedWithPg,
	isTypeOrmError,
	isNodeSysError
} from '@core/error/Errors.guards';

function mapPgCode(code?: string): { kind: EDbErrorKind; retryable: boolean } {
	switch (code) {
		case '3D000':
			return { kind: EDbErrorKind.DB_NOT_FOUND, retryable: false };
		case '28P01':
			return { kind: EDbErrorKind.AUTH_FAILED, retryable: false };
		case '28000':
			return { kind: EDbErrorKind.ROLE_NOT_FOUND, retryable: false };
		case '57P03':
			return { kind: EDbErrorKind.CANNOT_CONNECT_NOW, retryable: true };
		case '53300':
			return { kind: EDbErrorKind.TOO_MANY_CONNECTIONS, retryable: true };
		case '08001':
			return { kind: EDbErrorKind.CONNECTION_FAILED, retryable: true };
		default:
			return { kind: EDbErrorKind.UNKNOWN, retryable: true };
	}
}

export function toOrmConnectError(e: unknown): IOrmConnectError {
	// 1) QueryFailedError с pg-кодом
	if (isQueryFailedWithPg(e)) {
		const drv = e.driverError as DatabaseError;
		const { kind, retryable } = mapPgCode(drv.code);
		const err = new Error(e.message) as IOrmConnectError;
		err.driver = 'postgres';
		err.kind = kind;
		if (drv.code) {
			err.code = drv.code;
		}
		err.retryable = retryable;
		err.original = e;
		return err;
	}

	// 2) Сырая pg-ошибка (без обёртки TypeORM) — часто при initialize()
	if (isPgDatabaseError(e)) {
		const pg = e as DatabaseError;
		const { kind, retryable } = mapPgCode(pg.code);
		const err = new Error(pg.message) as IOrmConnectError;
		err.driver = 'postgres';
		err.kind = kind;
		if (pg.code) {
			err.code = pg.code;
		}
		err.retryable = retryable;
		err.original = e;
		return err;
	}

	// 3) Node system
	if (isNodeSysError(e, 'ECONNREFUSED')) {
		const err = new Error(
			(e as any).message ?? 'ECONNREFUSED'
		) as IOrmConnectError;
		err.driver = 'postgres';
		err.kind = EDbErrorKind.CONNECTION_FAILED;
		err.retryable = true;
		err.original = e;
		return err;
	}
	if (isNodeSysError(e, 'ETIMEDOUT')) {
		const err = new Error(
			(e as any).message ?? 'ETIMEDOUT'
		) as IOrmConnectError;
		err.driver = 'postgres';
		err.kind = EDbErrorKind.TIMEOUT;
		err.retryable = true;
		err.original = e;
		return err;
	}

	// 4) Прочие ошибки TypeORM (без pg-кода)
	if (isTypeOrmError(e)) {
		const err = new Error(
			(e as any).message ?? 'TypeORM error'
		) as IOrmConnectError;
		err.driver = 'unknown' as TDbDriver;
		err.kind = EDbErrorKind.UNKNOWN;
		err.retryable = true;
		err.original = e;
		return err;
	}

	// 5) Запасной случай
	const err = new Error(
		(e as any)?.message ?? 'Unknown DB error'
	) as IOrmConnectError;
	err.driver = 'unknown' as TDbDriver;
	err.kind = EDbErrorKind.UNKNOWN;
	err.retryable = true;
	err.original = e;
	return err;
}
