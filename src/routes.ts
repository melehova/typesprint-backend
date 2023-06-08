import { FastifyInstance } from 'fastify';
import { login, logout, callback } from './handlers/auth';
import { createRoom, joinRoom } from './handlers/rooms';
import verification from './middleware/verification';

export default function router(server: FastifyInstance, opts: any, done: () => void): void {
    // server.get('/', handler);
    server.get('/login', login);
    server.get('/callback', callback);
    server.get('/logout', { preValidation: verification }, logout);

    server.post('/room/create', { preValidation: verification }, createRoom);
    server.get('/room/join/:roomId', { preValidation: verification }, joinRoom);

    done();
}