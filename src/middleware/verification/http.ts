import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { validateToken} from '../../helpers/token';

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
            maxAge: 30 * 24 * 60 * 60,
        });

        reply.setCookie('user-id', userId, {
            path: '/',
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60,
        });

    } catch (error: any) {
        console.error(error);
        reply.code(500).send({ error });
    }
};