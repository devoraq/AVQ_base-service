/**
 * @file TypeOrmPostgres.module.ts
 * @module core/base
 *
 * @description
 * Реализация ORM-модуля для PostgreSQL на базе TypeORM.
 * Никакого SQL руками — работаем через репозитории и менеджер.
 *
 * Требования:
 * - пакеты: typeorm, pg, reflect-metadata
 * - в точке входа: import 'reflect-metadata'
 * - в tsconfig: "experimentalDecorators": true, "emitDecoratorMetadata": true
 */

/**
 * ! lib imports
 */
import 'reflect-metadata';
import {
	DataSource,
	EntityManager,
	Repository,
	type DataSourceOptions,
	type EntityTarget,
	type ObjectLiteral
} from 'typeorm';

/**
 * ! my imports
 */
import { OrmDatabaseModule } from '@core/base';
import { EOrmStatus } from '@core/types';

type PgOptions = Omit<DataSourceOptions, 'type'> & { type: 'postgres' };

export interface TypeOrmPgConfig {
	/** Полный URL имеет приоритет над остальными полями */
	url?: string; // пример: postgres://user:pass@localhost:5432/app
	host?: string;
	port?: number;

	username?: string;
	password?: string;
	database?: string;

	/** Пути к сущностям/миграциям/сабскрайберам */
	entities: NonNullable<DataSourceOptions['entities']>;
	migrations?: DataSourceOptions['migrations'];
	subscribers?: DataSourceOptions['subscribers'];

	/** Режимы и доп. опции */
	logging?: DataSourceOptions['logging'];
	synchronize?: boolean; // только для dev!
	poolSize?: number; // max connections
	extra?: DataSourceOptions['extra']; // любые доп. настройки драйвера pg
}

export class TypeOrmPostgresModule extends OrmDatabaseModule<
	DataSource,
	EntityManager,
	Repository<any>
> {
	private ds!: DataSource;
	private readonly options: PgOptions;

	constructor(name: string, cfg: TypeOrmPgConfig) {
		super(name);

		// пул соединений (pg): max — это поле в extra драйвера pg

		const extra =
			cfg.poolSize || cfg.extra
				? {
						...(cfg.extra ?? {}),
						...(cfg.poolSize ? { max: cfg.poolSize } : {})
				  }
				: undefined;

		this.options = {
			type: 'postgres',
			entities: cfg.entities,
			logging: cfg.logging ?? false,
			synchronize: cfg.synchronize ?? false,
			...(cfg.migrations ? { migrations: cfg.migrations } : {}),
			...(cfg.subscribers ? { subscribers: cfg.subscribers } : {}),
			...(cfg.url
				? { url: cfg.url }
				: {
						host: cfg.host ?? '127.0.0.1',
						port: cfg.port ?? 5432,
						username: cfg.username ?? 'postgres',
						password: cfg.password ?? '',
						database: cfg.database ?? 'postgres'
				  }),
			...(extra ? { extra } : {})
		};
	}

	protected async doConnect(): Promise<void> {
		this.ds = new DataSource(this.options as DataSourceOptions);
		await this.ds.initialize();
	}

	protected async doDisconnect(): Promise<void> {
		if (this.ds && this.ds.isInitialized) {
			await this.ds.destroy();
		}
	}

	async ping(): Promise<boolean> {
		if (this.getStatus() !== EOrmStatus.CONNECTED) return false;
		try {
			console.log(await this.ds.query('SELECT 1'));
			return true;
		} catch {
			return false;
		}
	}

	getDataSource(): DataSource {
		return this.ds;
	}

	getManager(): EntityManager {
		return this.ds.manager;
	}

	getRepository<TEntity extends ObjectLiteral>(
		target: EntityTarget<TEntity>
	): Repository<TEntity> {
		return this.ds.getRepository<TEntity>(target);
	}

	async transaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
		return this.ds.transaction(async manager => fn(manager));
	}
}
