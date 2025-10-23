/**
 * @file Errors.guards.ts
 * @module core/error
 * @description Guards for database errors
 */

/**
 * ! lib imports
 */
import type { DatabaseError } from 'pg';
import { TypeORMError, QueryFailedError } from 'typeorm';

export function isTypeOrmError(e: unknown): e is TypeORMError {
	return e instanceof TypeORMError;
}

export function isQueryFailedError(e: unknown): e is QueryFailedError {
	return e instanceof QueryFailedError;
}

/** Ошибка драйвера pg (то, что содержит code: '3D000', '28P01', ...) */
export function isPgDatabaseError(e: unknown): e is DatabaseError {
	return (
		!!e &&
		typeof (e as any).code === 'string' &&
		typeof (e as any).message === 'string'
	);
}

/** QueryFailedError с прокинутой pg-ошибкой внутри */
export function isQueryFailedWithPg(
	e: unknown
): e is QueryFailedError & { driverError: DatabaseError } {
	return isQueryFailedError(e) && isPgDatabaseError((e as any).driverError);
}

/** Системные ошибки Node (ECONNREFUSED/ETIMEDOUT) */
export function isNodeSysError(
	e: unknown,
	code: string
): e is NodeJS.ErrnoException {
	return !!e && typeof (e as any).code === 'string' && (e as any).code === code;
}
