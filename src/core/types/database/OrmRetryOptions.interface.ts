/**
 * @file OrmRetryOptions.interface.ts
 * @module core/types/database
 */

export interface OrmRetryOptions {
	maxAttempts?: number; // 0 = бесконечно
	baseDelayMs?: number; // стартовая пауза
	factor?: number; // множитель экспоненциальной паузы
	maxDelayMs?: number; // верхняя граница
}
