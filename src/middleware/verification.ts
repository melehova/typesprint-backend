import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { redis } from '../index';
import refreshToken from './refreshToken';

declare module 'fastify' {
    interface FastifyRequest {
        userId?: string;
    }
}
export default async (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    try {
        const access_token = request.cookies?.access_token || '';

        const tokenExists = await redis.exists(access_token);
        if (!tokenExists) {
            throw new Error('Unauthorized');
        }

        const accessToken = await refreshToken(access_token);

        reply.setCookie('access_token', accessToken, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });

        done();
    } catch (error: any) {
        reply.code(401).send(error);
    }
};
