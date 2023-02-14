import * as redis from "redis-client";

export type RedisClient = redis.RedisClusterType<redis.RedisModules, redis.RedisFunctions, redis.RedisScripts>;
