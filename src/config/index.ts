/**
 * Конфигурация приложения
 * @module config
 * @description
 * Централизует конфигурацию приложения из нескольких источников:
 * - Переменные окружения (.env)
 * - JSON-файлы конфигурации
 * - Значения по умолчанию
 *
 * @author Dmytro Shakh
 */

export * from './database.config';
export * from './logger.config';
export * from './server.config';
