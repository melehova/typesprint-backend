import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { RedisClientType, createClient } from '@redis/client';
import cookie from '@fastify/cookie';
import type { FastifyCookieOptions } from '@fastify/cookie';

import axios from 'axios';
import dotenv from 'dotenv';
import verification from './middleware/verification';

import fastifySocketIO from 'fastify-socket.io';

dotenv.config();
const server = fastify();

export const redis: RedisClientType = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PWD,
});

server.register(cookie, {
    secret: "secret",
    parseOptions: {}
} as FastifyCookieOptions);


server.register(fastifySocketIO);

const start = async () => {
    try {
        await redis.connect();

        redis.on('error', (err) => console.error('Redis error:', err));

        server.listen({ port: process.env.PORT }, (_, address) => {
            console.log(`Server is running at: ${address}`);
        });

        console.log('Connected to redis');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();
server.ready((err) => {
    if (err) {
        throw err;
    }

    server.io.on('connection', (socket) => {
        console.log(`A user [${socket.id}] connected`);

        socket.on('message', (message) => {
            console.log('Received message:', message);
            // Broadcast the message to all connected clients
            // socket.broadcast.emit('message', message);
            server.io.emit('message', message);
        });

        socket.on('disconnect', (socket) => {
            console.log(`A user [${socket}] disconnected`);
        });
    });
});

server.get('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const redirectUri = `http://${process.env.HOST}:${process.env.PORT}/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email&prompt=select_account`;
    reply.redirect(authUrl);
});

server.get('/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { code } = request.query as { code?: string };

        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `http://${process.env.HOST}:${process.env.PORT}/callback`,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { access_token },
        });

        const { data: { sub: userId, expires_in } } = response;

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = +expires_in + now;

        // Store the access token in Redis
        await redis.set(access_token, JSON.stringify({ userId, expiresAt }));

        // Set the access token as a cookie
        reply.setCookie('access_token', access_token, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });

        reply.send({ message: 'OAuth callback successful' });
    } catch (error) {
        console.error('OAuth callback error:', error);
        reply.code(500).send({ error: 'OAuth callback failed' });
    }
});

server.get('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { access_token } = request.cookies;
        // Remove user data from Redis
        await redis.del(access_token || '');
        reply.clearCookie('access_token');

        reply.send({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        reply.code(500).send({ error: 'Logout failed' });
    }
});

server.get('/', { preHandler: verification }, (req, reply) => 'boom');

server.get('/ping', () => 'pong\n');