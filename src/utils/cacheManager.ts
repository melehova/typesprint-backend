import { RedisClientType, createClient } from '@redis/client';
class CacheManager {
    public redis!: RedisClientType;

    connect = (config: { host: string; port: number; password: string }): void => {
        this.createRedis(config);
    };

    private createRedis = async (config: { host: string; port: number; password: string }): Promise<void> => {
        this.redis = createClient({
            url: `redis://${config.host}:${config.port}`,
            password: config.password,
        });

        this.redis.on('error', (err) => console.error('Redis Client Error', err));
        await this.redis.connect();
        console.log('Successfully connected to Redis');
    };

    public async hget<T>(key: string, field: string): Promise<string | null> {
        try {
            return await this.redis.hGet(key, field) || null;
        } catch (error) {
            throw new Error('Error accessing hash cache');
        }
    }

    public async hgetall<T>(key: string): Promise<{ [x: string]: string; } | null> {
        try {
            return await this.redis.hGetAll(key);
        } catch (error) {
            throw new Error('Error accessing hash cache');
        }
    }

    public async hset(key: string, field: string, value: any): Promise<void> {
        try {
            await this.redis.hSet(key, field, typeof value !== 'string' ? JSON.stringify(value) : value);
        } catch (error) {
            throw new Error('Error setting hash cache');
        }
    }

    public async hdel(key: string, field: string): Promise<void> {
        try {
            await this.redis.hDel(key, field);
        } catch (error) {
            throw new Error('Error deleting hash cache');
        }
    }

    public async del(key: string): Promise<number> {
        try {
            return await this.redis.del(key);
        } catch (error) {
            throw new Error('Error deleting cache');
        }
    }

    public async sadd(key: string, member: string | object): Promise<number> {
        return await this.redis.sAdd(key, JSON.stringify(member));
    }

    public async smembers(key: string) {
        return (await this.redis.sMembers(key)).map(m => JSON.parse(m));
    }
}

export default new CacheManager();