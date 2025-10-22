/**
 * @file ConsolePrintOptions.interface.ts
 * @module core/types/logger
 *
 * @author Dmytro Shakh
 */

export interface ConsolePrintOptions {
	/**
	 * Красиво форматировать details (JSON.stringify с отступами)
	 * @default false
	 */
	prettyDetails?: boolean;
	/**
	 * Число пробелов для pretty-режима
	 * @default 2
	 */
	detailsIndent?: number;
	/**
	 * Максимальная длина строки details (обрезка, если > 0)
	 * @default 4000
	 */
	maxDetailsLength?: number;
	/**
	 * Печатать requestId (если есть)
	 * @default true
	 */
	showRequestId?: boolean;
	/**
	 * Печатать stack у ошибок (иначе только message)
	 * @default true
	 */
	showErrorStack?: boolean;
	/**
	 * Использовать ANSI-цвета
	 * - При включенном режиме выводится лог с цветными кодами ANSI, что делает его более читаемым.
	 * @default true
	 */
	colorize?: boolean;
}
