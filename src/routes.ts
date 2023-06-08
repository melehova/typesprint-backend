import { FastifyInstance } from 'fastify';
import { login, logout, callback } from './handlers/auth';
import { createRoom } from './handlers/rooms';
import verification from './middleware/verification';

export default function router(server: FastifyInstance, opts: any, done: () => void): void {
    // server.get('/', handler);
    server.get('/login', login);
    server.get('/callback', callback);
    server.get('/logout', { preValidation: verification }, logout);

    server.post('/room/create', { preValidation: verification }, createRoom);

    done();
}