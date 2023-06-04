import { RedisClientType, createClient } from '@redis/client';
import axios, { AxiosResponse } from 'axios';

interface TokenInfo {
    token: string;
    expired_at: string;
}

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

    public async hget<T>(key: string, field: string): Promise<T | null> {
        try {
            const value = await this.redis.hGet(key, field);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (error) {
            throw new Error('Error accessing hash cache');
        }
    }

    public async hset(key: string, field: string, value: any): Promise<void> {
        try {
            await this.redis.hSet(key, field, JSON.stringify(value));
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

    public async addToken(userId: string, token: string, expiredAt: Date): Promise<void> {
        const tokenInfo = {
            token: token,
            expired_at: expiredAt.toISOString(),
        };

        return await this.hset('tokens', userId, tokenInfo);
    }

    public async deleteToken(userId: string): Promise<void> {
        await this.hdel('tokens', userId);
    }

    public async validateToken(userId: string, token: string): Promise<boolean> {
        const cachedToken: TokenInfo | null = await this.hget<TokenInfo>('tokens', userId);

        if (cachedToken && cachedToken.token === token) {
            const currentTime = new Date().getTime();
            const expiredAt = new Date(cachedToken.expired_at).getTime();

            if (currentTime < expiredAt) {
                // Token is valid
                return true;
            } else {
                // Token has expired, refresh it
                const refreshedToken = await this.refreshToken(userId, token);

                if (refreshedToken) {
                    return true;
                } else {
                    // Refresh token failed, remove it from cache
                    await this.hdel('tokens', userId);
                    return false;
                }
            }
        }

        // Token not found in cache
        return false;
    }

    private async refreshToken(userId: string, token: string): Promise<string | null> {
        try {
            const response: AxiosResponse = await axios.post('https://oauth2.googleapis.com/token', {
                refresh_token: token,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                grant_type: 'refresh_token',
            });

            const { access_token, expires_in } = response.data;

            if (access_token && expires_in) {
                const expiredAt = new Date().getTime() + expires_in * 1000;
                const refreshedToken: TokenInfo = {
                    token: access_token,
                    expired_at: new Date(expiredAt).toISOString(),
                };

                await this.hset('tokens', userId, refreshedToken);
                return access_token;
            }

            return null;
        } catch (error) {
            throw new Error('Error refreshing token');
        }
    }
}

export default new CacheManager();