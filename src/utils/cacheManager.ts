import { RedisClientType, createClient } from '@redis/client';
import axios, { AxiosResponse } from 'axios';
import { GAME_STATE } from '../gamestates';

class CacheManager {
    private redis!: RedisClientType;

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

    public async sadd(key: string, member: string): Promise<number> {
        try {
            return await this.redis.sAdd(key, member);
        } catch (error) {
            throw new Error('Error adding value to set');
        }
    }

    public async addToken(userId: string, token: string, expiredIn: string): Promise<void> { // ok
        const expiresAt = new Date(new Date().getTime() + +expiredIn * 1000).toISOString();

        await this.hset(`token:${userId}`, 'token', token);
        await this.hset(`token:${userId}`, 'expiresAt', expiresAt);
    }

    public async deleteToken(userId: string): Promise<void> { // ok
        await this.del(`token:${userId}`);
    }

    public async validateToken(userId: string, token: string): Promise<boolean> { //
        const cachedToken = await this.hgetall(`token:${userId}`);

        if (cachedToken && cachedToken.token === token) {
            const currentTime = new Date().getTime();
            const expiresAt = new Date(cachedToken.expiresAt).getTime();

            if (currentTime < expiresAt) {
                // Token is valid
                return true;
            } else {
                // Token has expired, refresh it
                const refreshedToken = await this.refreshToken(userId, token);

                if (refreshedToken) {
                    return true;
                } else {
                    // Refresh token failed, remove it from cache
                    await this.deleteToken(userId);
                    return false;
                }
            }
        }

        // Token not found in cache
        return false;
    }

    private async refreshToken(userId: string, token: string): Promise<any> {
        try {
            console.log('refresh', { userId, token });
            const response: AxiosResponse = await axios.post('https://oauth2.googleapis.com/token', {
                refresh_token: token,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                grant_type: 'refresh_token',
            });

            const { access_token, expires_in } = response.data;

            if (access_token && expires_in) {
                await this.addToken(userId, access_token, expires_in);
                return access_token;
            }

            return null;
        } catch (error: any) {
            throw new Error(error);
        }
    }

    public async createRoom(roomId: string, userId: string): Promise<void | null> {
        try {
            await this.hset(`room:${roomId}`, 'host', userId);
            await this.hset(`room:${roomId}`, 'state', GAME_STATE.LOBBY);
            await this.addMember(roomId, userId);
        } catch (error) {
            throw new Error('Error creating room');
        }
    }

    public async validateRoom(roomId: string): Promise<number> {
        return await this.redis.exists(`room:${roomId}`);
    }

    public async addMember(roomId: string, userId: string): Promise<number | null> {
        try {
            return await this.sadd(`roomPlayers:${roomId}`, userId);
        } catch (error) {
            throw new Error('Error joining room');
        }
    }

    public async deleteRoom(roomId: string, userId: string): Promise<void> {
        try {
            await this.del(`roomPlayers:${roomId}`);
            await this.del(`room:${roomId}`);
        } catch (error) {
            throw new Error('Error deleting room');
        }
    }

    public async accessToRoom(roomId: string, userId: string) {
        const host = await this.hget(`room:${roomId}`, 'host');
        return (host === userId);
    }
}

export default new CacheManager();