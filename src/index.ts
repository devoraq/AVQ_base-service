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

	const stop = async () => {
		await app.stop();
		await orm.disconnect();
		process.exit(0);
	};
	process.on('SIGINT', stop);
	process.on('SIGTERM', stop);
}

main().catch(async e => {
	console.error(e);
	try {
		await orm.disconnect();
	} catch {}
	process.exit(1);
});
