/**
 * @file OrmDatabase.module.ts
 * @module core/base
 *
 * @description
 * Абстрактный ORM-модуль: общий жизненный цикл, статусы, ретраи.
 */

/**
 * ! my imports
 */
import { DATABASE_CONFIG } from '@config';
import { BaseModule } from '@core/base';
import {
	EOrmStatus,
	EModuleType,
	OrmRetryOptions,
	type IOrmDatabaseModule
} from '@core/types';

export abstract class OrmDatabaseModule<
		TDataSource = unknown,
		TManager = unknown,
		TRepository = unknown
	>
	extends BaseModule
	implements IOrmDatabaseModule<TDataSource, TManager, TRepository>
{
	protected readonly ormName: string;
	protected status: EOrmStatus = EOrmStatus.IDLE;

	protected constructor(ormName: string) {
		super(EModuleType.DATABASE, `${ormName}Orm`);
		this.ormName = ormName;
	}

	getName(): string {
		return this.ormName;
	}

	getStatus(): EOrmStatus {
		return this.status;
	}

	/** Реальные операции подключения/отключения реализуют наследники */
	protected abstract doConnect(): Promise<void>;
	protected abstract doDisconnect(): Promise<void>;

	abstract ping(): Promise<boolean>;
	abstract getDataSource(): TDataSource;
	abstract getManager(): TManager;
	abstract getRepository<Entity>(target: unknown): TRepository;
	abstract transaction<T>(fn: (manager: TManager) => Promise<T>): Promise<T>;

	/** Публичный connect с ретраями */
	async connect(retry: OrmRetryOptions = {}): Promise<void> {
		if (this.status === EOrmStatus.CONNECTED) return;

		const {
			maxAttempts = DATABASE_CONFIG.CONNECT.MAX_ATTEMPTS,
			baseDelayMs = DATABASE_CONFIG.CONNECT.BASE_DELAY_MS,
			factor = DATABASE_CONFIG.CONNECT.FACTOR,
			maxDelayMs = DATABASE_CONFIG.CONNECT.MAX_DELAY_MS
		} = retry;

		this.status = EOrmStatus.CONNECTING;
		let attempt = 0;
		let delay = baseDelayMs;

		// 0 = бесконечно
		while (maxAttempts === 0 || attempt < maxAttempts) {
			attempt++;
			try {
				await this.doConnect();
				this.status = EOrmStatus.CONNECTED;
				this.info(`ORM connected: ${this.ormName} (attempt #${attempt})`);
				return;
			} catch (e) {
				this.warn(`ORM connect failed: ${this.ormName} (attempt #${attempt})`, {
					details: { error: String(e) }
				});
				this.status = EOrmStatus.ERROR;
				if (maxAttempts !== 0 && attempt >= maxAttempts) throw e;
				await new Promise(r => setTimeout(r, Math.min(delay, maxDelayMs)));
				delay = Math.min(delay * factor, maxDelayMs);
				this.status = EOrmStatus.CONNECTING;
			}
		}
	}

	async disconnect(): Promise<void> {
		if (
			this.status !== EOrmStatus.CONNECTED &&
			this.status !== EOrmStatus.ERROR
		) {
			this.status = EOrmStatus.DISCONNECTED;
			return;
		}
		try {
			await this.doDisconnect();
			this.status = EOrmStatus.DISCONNECTED;
			this.info(`ORM disconnected: ${this.ormName}`);
		} catch (e) {
			this.warn(`ORM disconnect error: ${this.ormName}`, {
				details: { error: String(e) }
			});
			this.status = EOrmStatus.DISCONNECTED;
		}
	}
}
