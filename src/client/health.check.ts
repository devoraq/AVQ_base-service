/**
 * @file health.check.ts
 * @description Простая проверка gRPC-роутера Health: вызывает Check и печатает ответ.
 */

import { SERVER_CONFIG } from '@config';
import { credentials, ChannelCredentials, Metadata } from '@grpc/grpc-js';
import {
	HealthServiceClient,
	HealthCheckRequest,
	HealthCheckResponse
} from '@proto/proto/health';

function createClient(addr: string, creds: ChannelCredentials) {
	return new HealthServiceClient(addr, creds);
}

async function callCheck(serviceName = 'core'): Promise<HealthCheckResponse> {
	const client = createClient(
		`${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`,
		credentials.createInsecure()
	);
	const md = new Metadata();
	md.set('x-request-id', crypto.randomUUID?.() ?? String(Date.now()));

	const req: HealthCheckRequest = { service: serviceName };
	const deadline = Date.now() + SERVER_CONFIG.DEADLINE_MS;

	return new Promise<HealthCheckResponse>((resolve, reject) => {
		client.check(req, md, { deadline }, (err, res) => {
			if (err) return reject(err);
			resolve(res);
		});
	});
}

(async () => {
	try {
		const res = await callCheck(process.argv[2] ?? 'core');
		console.log('[health]', res);
		process.exit(0);
	} catch (e) {
		console.error('[health][error]', e);
		process.exit(1);
	}
})();
