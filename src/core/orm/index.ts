/**
 * @file index.ts
 * @module orm
 * Модуль ORM для подключения к базе данных PostgreSQL.
 */

/**
 * ! my imports
 */
import { DATABASE_CONFIG } from '@config';
import { TypeOrmPostgresModule } from '@core/base';

export const orm = new TypeOrmPostgresModule('PrimaryPg', {
	url: DATABASE_CONFIG.URL,
	entities: DATABASE_CONFIG.ENTITIES,
	logging: DATABASE_CONFIG.LOGGING,
	synchronize: DATABASE_CONFIG.SYNCHRONIZE,
	poolSize: DATABASE_CONFIG.POOL_SIZE
});
