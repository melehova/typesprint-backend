import { FastifyInstance } from 'fastify';
import { login, logout, callback, profile } from '../handlers/auth';
import { createRoom } from '../handlers/rooms';
import verification from '../middleware/verification/http';
import { validateRoom, accessToRoom } from '../middleware/rooms';

export default function router(server: FastifyInstance, opts: any, done: () => void): void {
    server.get('/login', login);
    server.get('/callback', callback);
    server.get('/profile', { preValidation: verification }, profile);
    server.get('/logout', { preValidation: verification }, logout);

    server.post('/room/create', { preValidation: verification }, createRoom);
    done();
}