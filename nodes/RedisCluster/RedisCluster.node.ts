import type { IExecuteFunctions } from 'n8n-core';
import type {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { set } from 'lodash';
import * as redis from 'redis-client';
import {getRedisClient} from "./GenericFunctions";

type RedisClient = redis.RedisClusterType<redis.RedisModules, redis.RedisFunctions, redis.RedisScripts>;

export class RedisCluster implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Redis Cluster',
		name: 'redisCluster',
		icon: 'file:redis-cluster.svg',
		group: ['input'],
		version: 1,
		description: 'Get, send and update data in Redis',
		defaults: {
			name: 'Redis Cluster',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'redisCluster',
				required: true,
				testedBy: 'testRedisClusterConnection',
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a key from Redis',
						// eslint-disable-next-line n8n-nodes-base/node-param-operation-option-action-miscased
						action: 'Delete a key from Redis',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get the value of a key from Redis',
						// eslint-disable-next-line n8n-nodes-base/node-param-operation-option-action-miscased
						action: 'Get the value of a key from Redis',
					},
					{
						name: 'Increment',
						value: 'incr',
						description: 'Atomically increments a key by 1. Creates the key if it does not exist.',
						// eslint-disable-next-line n8n-nodes-base/node-param-operation-option-action-miscased
						action: 'Atomically increment a key by 1. Creates the key if it does not exist.',
					},
					{
						name: 'Keys',
						value: 'keys',
						description: 'Returns all the keys matching a pattern',
						action: 'Return all keys matching a pattern',
					},
					{
						name: 'Pop',
						value: 'pop',
						description: 'Pop data from a redis list',
						action: 'Pop data from a redis list',
					},
					{
						name: 'Publish',
						value: 'publish',
						description: 'Publish message to redis channel',
						action: 'Publish message to redis channel',
					},
					{
						name: 'Push',
						value: 'push',
						description: 'Push data to a redis list',
						action: 'Push data to a redis list',
					},
					{
						name: 'Set',
						value: 'set',
						description: 'Set the value of a key in redis',
						action: 'Set the value of a key in redis',
					},
				],
				default: 'get',
			},

			// ----------------------------------
			//         get
			// ----------------------------------
			{
				displayName: 'Name',
				name: 'propertyName',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				default: 'propertyName',
				required: true,
				description:
					'Name of the property to write received data to. Supports dot-notation. Example: "data.person[0].name".',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the key to delete from Redis',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the key to get from Redis',
			},
			{
				displayName: 'Key Type',
				name: 'keyType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				options: [
					{
						name: 'Automatic',
						value: 'automatic',
						description: 'Requests the type before requesting the data (slower)',
					},
					{
						name: 'Hash',
						value: 'hash',
						description: "Data in key is of type 'hash'",
					},
					{
						name: 'List',
						value: 'list',
						description: "Data in key is of type 'lists'",
					},
					{
						name: 'Sets',
						value: 'sets',
						description: "Data in key is of type 'sets'",
					},
					{
						name: 'String',
						value: 'string',
						description: "Data in key is of type 'string'",
					},
				],
				default: 'automatic',
				description: 'The type of the key to get',
			},

			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['get'],
					},
				},
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Dot Notation',
						name: 'dotNotation',
						type: 'boolean',
						default: true,
						// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
						description:
							'<p>By default, dot-notation is used in property names. This means that "a.b" will set the property "b" underneath "a" so { "a": { "b": value} }.<p></p>If that is not intended this can be deactivated, it will then set { "a.b": value } instead.</p>.',
					},
				],
			},

			// ----------------------------------
			//         incr
			// ----------------------------------
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['incr'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the key to increment',
			},
			{
				displayName: 'Expire',
				name: 'expire',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['incr'],
					},
				},
				default: false,
				description: 'Whether to set a timeout on key',
			},
			{
				displayName: 'TTL',
				name: 'ttl',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['incr'],
						expire: [true],
					},
				},
				default: 60,
				description: 'Number of seconds before key expiration',
			},

			// ----------------------------------
			//         keys
			// ----------------------------------
			{
				displayName: 'Key Pattern',
				name: 'keyPattern',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['keys'],
					},
				},
				default: '',
				required: true,
				description: 'The key pattern for the keys to return',
			},
			{
				displayName: 'Get Values',
				name: 'getValues',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['keys'],
					},
				},
				default: true,
				description: 'Whether to get the value of matching keys',
			},
			// ----------------------------------
			//         set
			// ----------------------------------
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the key to set in Redis',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
				default: '',
				description: 'The value to write in Redis',
			},
			{
				displayName: 'Key Type',
				name: 'keyType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
				options: [
					{
						name: 'Automatic',
						value: 'automatic',
						description: 'Tries to figure out the type automatically depending on the data',
					},
					{
						name: 'Hash',
						value: 'hash',
						description: "Data in key is of type 'hash'",
					},
					{
						name: 'List',
						value: 'list',
						description: "Data in key is of type 'lists'",
					},
					{
						name: 'Sets',
						value: 'sets',
						description: "Data in key is of type 'sets'",
					},
					{
						name: 'String',
						value: 'string',
						description: "Data in key is of type 'string'",
					},
				],
				default: 'automatic',
				description: 'The type of the key to set',
			},

			{
				displayName: 'Expire',
				name: 'expire',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
				default: false,
				description: 'Whether to set a timeout on key',
			},

			{
				displayName: 'TTL',
				name: 'ttl',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['set'],
						expire: [true],
					},
				},
				default: 60,
				description: 'Number of seconds before key expiration',
			},
			// ----------------------------------
			//         publish
			// ----------------------------------
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['publish'],
					},
				},
				default: '',
				required: true,
				description: 'Channel name',
			},
			{
				displayName: 'Data',
				name: 'messageData',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['publish'],
					},
				},
				default: '',
				required: true,
				description: 'Data to publish',
			},
			// ----------------------------------
			//         push/pop
			// ----------------------------------
			{
				displayName: 'List',
				name: 'list',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['push', 'pop'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the list in Redis',
			},
			{
				displayName: 'Data',
				name: 'messageData',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['push'],
					},
				},
				default: '',
				required: true,
				description: 'Data to push',
			},
			{
				displayName: 'Tail',
				name: 'tail',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['push', 'pop'],
					},
				},
				default: false,
				description: 'Whether to push or pop data from the end of the list',
			},
			{
				displayName: 'Name',
				name: 'propertyName',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['pop'],
					},
				},
				default: 'propertyName',
				description:
					'Optional name of the property to write received data to. Supports dot-notation. Example: "data.person[0].name".',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['pop'],
					},
				},
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Dot Notation',
						name: 'dotNotation',
						type: 'boolean',
						default: true,
						// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
						description:
							'<p>By default, dot-notation is used in property names. This means that "a.b" will set the property "b" underneath "a" so { "a": { "b": value} }.<p></p>If that is not intended this can be deactivated, it will then set { "a.b": value } instead.</p>.',
					},
				],
			},
		],
	};

	methods = {
		credentialTest: {
			async testRedisClusterConnection(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as ICredentialDataDecryptedObject;

				try {
					const client = getRedisClient(credentials);

					await client.connect();
					await client.quit();

				} catch (error) {
					return {
						status: 'Error',
						message: error.message,
					};
				}
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		async function getValue(client: RedisClient, keyName: string, type?: string) {
			if (type === undefined || type === 'automatic') {
				// Request the type first
				type = await client.type(keyName);
			}

			if (type === 'string') {
				return client.get(keyName);
			} else if (type === 'hash') {
				return client.hGetAll(keyName);
			} else if (type === 'list') {
				return client.lRange(keyName, 0, -1);
			} else if (type === 'sets') {
				return client.sMembers(keyName);
			} else {
				return client.get(keyName);
			}
		}

		const setValue = async (
			client: RedisClient,
			keyName: string,
			value: string | number | object | string[] | number[],
			expire: boolean,
			ttl: number,
			type?: string,
		) => {
			if (type === undefined || type === 'automatic') {
				// Request the type first
				if (typeof value === 'string') {
					type = 'string';
				} else if (Array.isArray(value)) {
					type = 'list';
				} else if (typeof value === 'object') {
					type = 'hash';
				} else {
					throw new NodeOperationError(
						this.getNode(),
						'Could not identify the type to set. Please set it manually!',
					);
				}
			}

			if (type === 'string') {
				await client.set(keyName, `${value}`);
			} else if (type === 'hash') {
				for (const key of Object.keys(value)) {
					await client.hSet(keyName, key, `${(value as IDataObject)[key]!}`);
				}
			} else if (type === 'list') {
				for (let index = 0; index < (value as string[]).length; index++) {
					await client.lSet(keyName, index, `${(value as IDataObject)[index]!}`);
				}
			}

			if (expire) {
				await client.expire(keyName, ttl);
			}
			return;
		};

		return new Promise(async (resolve, reject) => {
			const credentials = await this.getCredentials('redisCluster');
			const client = getRedisClient(credentials);
			const operation = this.getNodeParameter('operation', 0);

			await client.connect();

			try {
				if (
					['delete', 'get', 'keys', 'set', 'incr', 'publish', 'push', 'pop'].includes(operation)
				) {
					const items = this.getInputData();
					const returnItems: INodeExecutionData[] = [];

					let item: INodeExecutionData;
					for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
						item = { json: {} };

						if (operation === 'delete') {
							const keyDelete = this.getNodeParameter('key', itemIndex) as string;
							await client.del(keyDelete);
							returnItems.push(items[itemIndex]);
						} else if (operation === 'get') {
							const propertyName = this.getNodeParameter('propertyName', itemIndex) as string;
							const keyGet = this.getNodeParameter('key', itemIndex) as string;
							const keyType = this.getNodeParameter('keyType', itemIndex) as string;

							const value = (await getValue(client, keyGet, keyType)) || null;

							const options = this.getNodeParameter('options', itemIndex, {});

							if (options.dotNotation === false) {
								item.json[propertyName] = value;
							} else {
								set(item.json, propertyName, value);
							}

							returnItems.push(item);
						} else if (operation === 'set') {
							const keySet = this.getNodeParameter('key', itemIndex) as string;
							const value = this.getNodeParameter('value', itemIndex) as string;
							const keyType = this.getNodeParameter('keyType', itemIndex) as string;
							const expire = this.getNodeParameter('expire', itemIndex, false) as boolean;
							const ttl = this.getNodeParameter('ttl', itemIndex, -1) as number;

							await setValue(client, keySet, value, expire, ttl, keyType);
							returnItems.push(items[itemIndex]);
						} else if (operation === 'incr') {
							const keyIncr = this.getNodeParameter('key', itemIndex) as string;
							const expire = this.getNodeParameter('expire', itemIndex, false) as boolean;
							const ttl = this.getNodeParameter('ttl', itemIndex, -1) as number;
							const incrementVal = await client.incr(keyIncr);
							if (expire && ttl > 0) {
								await client.expire(keyIncr, ttl);
							}
							returnItems.push({ json: { [keyIncr]: incrementVal } });
						} else if (operation === 'publish') {
							const channel = this.getNodeParameter('channel', itemIndex) as string;
							const messageData = this.getNodeParameter('messageData', itemIndex) as string;
							await client.publish(channel, messageData);
							returnItems.push(items[itemIndex]);
						} else if (operation === 'push') {
							const redisList = this.getNodeParameter('list', itemIndex) as string;
							const messageData = this.getNodeParameter('messageData', itemIndex) as string;
							const tail = this.getNodeParameter('tail', itemIndex, false) as boolean;
							const action = tail ? client.RPUSH : client.LPUSH;
							await action(redisList, messageData);
							returnItems.push(items[itemIndex]);
						} else if (operation === 'pop') {
							const redisList = this.getNodeParameter('list', itemIndex) as string;
							const tail = this.getNodeParameter('tail', itemIndex, false) as boolean;
							const propertyName = this.getNodeParameter(
								'propertyName',
								itemIndex,
								'propertyName',
							) as string;

							const action = tail ? client.rPop : client.lPop;
							const value = await action(redisList);

							let outputValue;
							try {
								outputValue = JSON.parse(value as string);
							} catch {
								outputValue = value;
							}
							const options = this.getNodeParameter('options', itemIndex, {});
							if (options.dotNotation === false) {
								item.json[propertyName] = outputValue;
							} else {
								set(item.json, propertyName, outputValue);
							}
							returnItems.push(item);
						}
					}

					await client.quit();
					resolve(this.prepareOutputData(returnItems));
				}
			} catch (error) {
				reject(error);
			}
		});
	}
}
