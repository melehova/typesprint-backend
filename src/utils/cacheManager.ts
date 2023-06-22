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

    public async hget<T>(key: string, field: string): Promise<T | null> {
        const value = await this.redis.hGet(key, field);
        return value ? JSON.parse(value) : null;

    }

    public async hgetall<T>(key: string): Promise<{ [x: string]: T } | null> {
        const values = await this.redis.hGetAll(key);
        return values ? Object.fromEntries(Object.entries(values).map(([k, v]) => [k, JSON.parse(v)])) : null;
    }


    public async hset(key: string, field: string, value: any): Promise<number> {
        return await this.redis.hSet(key, field, JSON.stringify(value));

    }

    public async hdel(key: string, field: string): Promise<void> {
        await this.redis.hDel(key, field);
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