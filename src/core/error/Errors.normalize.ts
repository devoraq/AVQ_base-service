/**
 * @file Errors.normalize.ts
 * @module core/error
 * @description Normalize database errors
 */

export type TDbDriver = 'postgres' | 'unknown';

export enum EDbErrorKind {
	DB_NOT_FOUND = 'DB_NOT_FOUND', // 3D000
	AUTH_FAILED = 'AUTH_FAILED', // 28P01
	ROLE_NOT_FOUND = 'ROLE_NOT_FOUND', // 28000
	CONNECTION_FAILED = 'CONNECTION_FAILED', // ECONNREFUSED/08001
	CANNOT_CONNECT_NOW = 'CANNOT_CONNECT_NOW', // 57P03
	TOO_MANY_CONNECTIONS = 'TOO_MANY_CONNECTIONS', // 53300
	TIMEOUT = 'TIMEOUT', // ETIMEDOUT
	UNKNOWN = 'UNKNOWN'
}

export interface IOrmConnectError extends Error {
	driver: TDbDriver;
	kind: EDbErrorKind;
	code?: string;
	retryable: boolean;
	original: unknown;
}
