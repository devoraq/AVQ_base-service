/**
 * @file index.ts
 */

/**
 * ! my imports
 */
import { App } from '@core/app';
import { HealthRouter } from '@modules/health/Health.router';
import { HealthServiceService } from '@proto/proto/health';

async function main() {
	const app = new App();

	const healthRouter = new HealthRouter();

	app.addRouter('Health', HealthServiceService, healthRouter.asServiceImpl());

	await app.start();
}

main();
