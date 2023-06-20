import { FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import cacheManager from '../utils/cacheManager';
import { addToken, deleteToken } from '../helpers/token';

export const login = async function (request: FastifyRequest, reply: FastifyReply) {
    const redirectUri = `http://${process.env.HOST}:${process.env.PORT}/api/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email&prompt=select_account`;
    reply.redirect(authUrl);
};

export const callback = async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        const { code } = request.query as { code?: string };

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `http://${process.env.HOST}:${process.env.PORT}/api/callback`,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        const { data: { sub: userId, expires_in } } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { access_token },
        });

        await addToken(userId, access_token, expires_in);

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
        reply.redirect(`http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}/callback`);

    } catch (error: any) {
        reply.code(500).send({ error: error.message });
    }
};

export const logout = async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        const { 'user-id': userId } = request.cookies;
        await deleteToken(userId || '');
        reply.clearCookie('access-token');
        reply.clearCookie('user-id');

        reply.redirect(`http://${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}/callback`);

    } catch (error) {
        reply.code(500).send({ error: 'Logout failed' });
    }
}

export const profile = async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        const { 'user-id': userId = '', 'access-token': accessToken = '' } = request.cookies;

        const { data: { names: [{ displayName }], photos: [{ url }] } } = await axios.get('https://people.googleapis.com/v1/people/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                personFields: 'names,photos',
            },
        });

        reply.code(200).send({ name: displayName, photo: url });

    } catch (error: any) {
        reply.code(500).send({ error: error.message });

    }
}