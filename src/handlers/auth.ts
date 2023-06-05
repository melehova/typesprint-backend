import { FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import cacheManager from '../utils/cacheManager';

export const login = async function (request: FastifyRequest, reply: FastifyReply) {
    const redirectUri = `http://${process.env.HOST}:${process.env.PORT}/api/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email&prompt=select_account`;
    reply.redirect(authUrl);
};

export const callback = async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        const { code } = request.query as { code?: string };

        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `http://${process.env.HOST}:${process.env.PORT}/api/callback`,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { access_token },
        });

        const { data: { sub: userId, expires_in } } = response;

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = new Date(+expires_in + now);

        // Store the access token in Redis
        await cacheManager.addToken(userId, access_token, expiresAt);

        // Set the access token as a cookie
        reply.setCookie('access-token', access_token, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });

        reply.setCookie('user-id', userId, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });
        reply.redirect(`http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}/room`);

        // reply.send({ message: 'OAuth callback successful' });
    } catch (error) {
        reply.code(500).send({ error: 'OAuth callback failed' });
    }
};

export const logout = async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        const { 'user-id': userId } = request.cookies;
        // Remove user data from Redis
        await cacheManager.deleteToken(userId || '');
        reply.clearCookie('access-token');
        reply.clearCookie('user-id');

        reply.send({ message: 'Logout successful' });
    } catch (error) {
        reply.code(500).send({ error: 'Logout failed' });
    }
}
