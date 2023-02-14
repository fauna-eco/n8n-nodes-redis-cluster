import {
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';

import {
	RedisClient,
} from './types';


import * as redis from "redis-client";

export function getRedisClient(
	credentials: ICredentialDataDecryptedObject,
) {
	const rootNodes: redis.RedisClientOptions[] = JSON.parse(credentials.rootNodes as string);
	const client: RedisClient = redis.createCluster({
		rootNodes: rootNodes,
		useReplicas: false,
		defaults: {
			socket: {
				tls: credentials.tls as boolean,
			},
			password: (credentials.password as string) || undefined,
		},
	});

	client.on('error', async (err) => {
		// TODO: This doesn't work, cannot throw from async function...
		await client.quit();
		throw err;
	});

	return client;
}
