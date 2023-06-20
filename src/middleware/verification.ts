import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import cacheManager from '../utils/cacheManager';
import { validateToken} from '../helpers/token';

export default async (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    try {
        const { 'user-id': userId = '', 'access-token': accessToken = '' } = request.cookies;

        // Verify and validate the token
        const isValidToken = await validateToken(userId, accessToken);

        if (!isValidToken && request.url !== '/api/logout') {
            // Handle invalid token case
            reply.code(401).send({ error: 'Invalid token' });
            return;
        }

        // Set the updated access token in the response cookies
        reply.setCookie('access-token', accessToken, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });

        reply.setCookie('user-id', userId, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });

    } catch (error: any) {
        reply.code(500).send({ error });
    }
};