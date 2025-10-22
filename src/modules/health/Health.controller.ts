/**
 * @file Health.controller.ts
 * @module modules/health
 */

/**
 * ! lib imports
 */
import { HealthCheckResponse, HealthCheckRequest } from '@proto/proto/health';

/**
 * ! my imports
 */
import { ControllerModule } from '@core/base';
import { IRpcContext } from '@core/types';

/**
 * Простая реализация HealthRouter.
 * Можно расширить логикой проверки подключений к БД, кэшу и т.д.
 */
export class HealthController extends ControllerModule {
	constructor() {
		super(HealthController.name);

		this.check = this.check.bind(this);
	}

	public async check(
		ctx: IRpcContext<HealthCheckRequest, HealthCheckResponse>
	): Promise<HealthCheckResponse> {
		this.info(
			`Health check for service: ${ctx.call.request.service || 'core'}`
		);

		return { status: `SERVING (${ctx.call.request.service || 'core'})` };
	}
}
