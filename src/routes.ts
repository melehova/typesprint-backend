import { FastifyInstance } from 'fastify';
import { login, logout, callback, profile } from './handlers/auth';
import { createRoom, joinRoom, deleteRoom } from './handlers/rooms';
import verification from './middleware/verification';
import { validateRoom, accessToRoom } from './middleware/rooms';

export default function router(server: FastifyInstance, opts: any, done: () => void): void {
    // server.get('/', handler);
    server.get('/login', login);
    server.get('/callback', callback);
    server.get('/profile', { preValidation: verification }, profile);
    server.get('/logout', { preValidation: verification }, logout);

    server.post('/room/create', { preValidation: verification }, createRoom);
    server.get('/room/join/:roomId', { preValidation: [verification, validateRoom] }, joinRoom);
    server.delete('/room/:roomId', { preValidation: [verification, validateRoom, accessToRoom] }, deleteRoom);

    done();
}