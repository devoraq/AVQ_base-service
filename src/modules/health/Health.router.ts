/**
 * @file Health.router.ts
 * @module modules/health
 *
 * @description
 * Базовый HealthRouter — проверка состояния сервера.
 * Возвращает простое сообщение со статусом "SERVING".
 */

/**
 * ! lib imports
 */
import type {
	HealthServiceServer,
	HealthCheckRequest,
	HealthCheckResponse
} from '@proto/proto/health';

/**
 * ! my imports
 */
import { RouterModule } from '@core/base';
import { HealthController } from '@modules/health/Health.controller';

/**
 * Простая реализация HealthRouter.
 * Можно расширить логикой проверки подключений к БД, кэшу и т.д.
 */
export class HealthRouter extends RouterModule {
	protected router: HealthController = new HealthController();

	constructor() {
		super(HealthRouter.name, 'health.HealthService');

		// Регистрируем контроллер Check
		this.handle<HealthCheckRequest, HealthCheckResponse>(
			'check',
			this.router.check
		);
	}

	/**
	 * Упаковка роутера в реализацию gRPC-сервиса.
	 */
	asServiceImpl(): HealthServiceServer {
		return {
			check: this.toUnaryHandler<HealthCheckRequest, HealthCheckResponse>(
				'check'
			)
		};
	}
}
