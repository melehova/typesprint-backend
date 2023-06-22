import dotenv from 'dotenv';
import fastify, { errorCodes } from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
import cors from '@fastify/cors';

import cookie from '@fastify/cookie';
import type { FastifyCookieOptions } from '@fastify/cookie';

import cacheManager from './utils/cacheManager';
import router from './routes/http';

import { roomHandler } from './handlers/socket';
import { Server } from 'socket.io';

dotenv.config();
const server = fastify({
    logger: require('pino')({
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true
            }
        }
    }),
});

server.setErrorHandler(function (error, request, reply) {
    if (error instanceof errorCodes.FST_ERR_BAD_STATUS_CODE) {
        this.log.error(error);
        reply.status(500).send({ ok: false });
    } else {
        // fastify will use parent error handler to handle this
        reply.send(error);
    }
})

server.register(cors, {
    origin: 'http://localhost:5173',
    credentials: true,
})

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
            host: process.env.REDIS_HOST!,
            port: +process.env.REDIS_PORT!,
            password: process.env.REDIS_PWD!
        });

        server.listen({ port: +process.env.PORT! }, (err, address) => {
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
    const io: Server = server.io;

    io.on('connection', (socket) => {
        roomHandler(io, socket);
    });
});
