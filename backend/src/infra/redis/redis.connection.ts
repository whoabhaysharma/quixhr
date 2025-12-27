import Redis from 'ioredis';
import { config } from '../../config';

export class RedisClient {
    private static instance: RedisClient | null = null;
    private client: Redis;

    private constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.client.on('connect', () => {
            console.log('✅ Redis connected');
        });

        this.client.on('error', (err) => {
            console.error('❌ Redis error:', err);
        });
    }

    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    public getClient(): Redis {
        return this.client;
    }

    public async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            RedisClient.instance = null;
        }
    }
}

// Export singleton instance and client for backward compatibility
export const redisClient = RedisClient.getInstance();
export const redis = redisClient.getClient();
export const getRedis = () => redis;
export const closeRedis = () => redisClient.close();
