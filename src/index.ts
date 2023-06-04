import fastify from 'fastify';

import cookie from '@fastify/cookie';
import type { FastifyCookieOptions } from '@fastify/cookie';
import cacheManager from './utils/cacheManager';

import dotenv from 'dotenv';
import verification from './middleware/verification';

import fastifySocketIO from 'fastify-socket.io';
import router from './routes';

dotenv.config();
const server = fastify();

server.register(cookie, {
    secret: "secret",
    parseOptions: {}
} as FastifyCookieOptions);

server.register(router, {
    prefix: '/api'
});

server.register(fastifySocketIO);

const start = async () => {
    try {
        cacheManager.connect({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PWD
        });

        server.listen({ port: process.env.PORT }, (err, address) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`Server is running at: ${address}`);
        });

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
        const room = 'some room';
        socket.join(room);
        console.log(`A user [${socket.id}] joined [${room}]`);
        socket.to(room).emit('message', `A user [${socket.id}] joined [${room}]`);

        socket.on('message', (message) => {
            console.log('Received message:', message);
            // Broadcast the message to all connected clients
            socket.to(room).emit('message', message);
        });

        socket.on('disconnect', (socket) => {
            console.log(`A user [${socket}] disconnected`);
        });
    });
});

server.get('/', { preHandler: verification }, (req, reply) => 'boom');

server.get('/ping', () => 'pong\n');