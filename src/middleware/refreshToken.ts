import axios from 'axios';
import { redis } from '../index';

interface TokenResponse {
    access_token: string;
    expires_in: number;
}

interface TokenInfo {
    userId: string;
}

export default async (refreshToken: string): Promise<string> => {
    try {
        const response = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });

        const { access_token, expires_in } = response.data;

        const tokenInfo: TokenInfo = JSON.parse(await redis.get(refreshToken) || '');
        const { userId } = tokenInfo;

        await redis.del(refreshToken);

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = expires_in + now;

        await redis.set(access_token, JSON.stringify({ userId, expiresAt }));

        return access_token;
    } catch (error) {
        throw new Error('Token refresh failed');
    }
};