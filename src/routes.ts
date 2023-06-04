import { FastifyInstance } from 'fastify';
import { login, logout, callback } from './handlers/auth';

export default function router(server: FastifyInstance, opts: any, done: () => void): void {
    // server.get('/', handler);
    server.get('/login', login);
    server.get('/callback', callback);
    server.get('/logout', logout);
    
    done();
}