import type {ICredentialType, INodeProperties} from 'n8n-workflow';

export class RedisCluster implements ICredentialType {
	name = 'redisCluster';
	displayName = 'Redis Cluster';
	properties: INodeProperties[] = [
		{
			displayName: 'Root Node URLs',
			name: 'rootNodes',
			type: 'json',
			typeOptions: {
				rows: 4,
				alwaysOpenEditWindow: true,
			},
			default: `[
  { "url": "redis://localhost:30001" },
  { "url": "redis://localhost:30002" },
  { "url": "redis://localhost:30003" }
]`,
			description: 'Comma separated JSON with root node URLs, including port.',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Use TLS',
			name: 'tls',
			type: 'boolean',
			default: false,
		},
	];
}
