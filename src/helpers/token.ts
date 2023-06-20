import cacheManager from '../utils/cacheManager';
import axios, { AxiosResponse } from 'axios';

export const addToken = async (userId: string, token: string, expiredIn: string): Promise<void> => { // ok
    const expiresAt = new Date(new Date().getTime() + +expiredIn * 1000).toISOString();

    await cacheManager.hset(`token:${userId}`, 'token', token);
    await cacheManager.hset(`token:${userId}`, 'expiresAt', expiresAt);
}

export const deleteToken = async (userId: string): Promise<void> => { 
    await cacheManager.del(`token:${userId}`);
}

export const validateToken = async (userId: string, token: string): Promise<boolean> => { //
    const cachedToken = await cacheManager.hgetall(`token:${userId}`);

    if (cachedToken && cachedToken.token === token) {
        const currentTime = new Date().getTime();
        const expiresAt = new Date(cachedToken.expiresAt).getTime();

        if (currentTime < expiresAt) {
            return true;
        } else {
            const refreshedToken = await refreshToken(userId, token);

            if (refreshedToken) {
                return true;
            } else {
                await deleteToken(userId);
                return false;
            }
        }
    }

    return false;
}

export const refreshToken = async (userId: string, token: string): Promise<any> => {
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
            await addToken(userId, access_token, expires_in);
            return access_token;
        }

        return null;
    } catch (error: any) {
        throw new Error(error);
    }
}