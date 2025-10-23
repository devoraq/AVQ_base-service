/**
 * @file index.ts
 * @module index
 *
 * @description
 * Запуск приложения
 */

/**
 * ! my imports
 */
import { App } from '@core/app';
import { orm } from '@core/orm';
import { HealthRouter } from '@modules/health/Health.router';
import { HealthServiceService } from '@proto/proto/health';

async function main() {
	const app = new App();

	app.addOrm(orm);

	const healthRouter = new HealthRouter();

	app.addRouter('Health', HealthServiceService, healthRouter.asServiceImpl());

	await app.start();
}

main();
