import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import cacheManager from '../utils/cacheManager';

export default async (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    try {
      const { 'user-id': userId = '', 'access-token': accessToken = '' } = request.cookies;
  
      // Verify and validate the token
      const isValidToken = await cacheManager.validateToken(userId, accessToken);
  
      if (!isValidToken) {
        // Handle invalid token case
        reply.code(401).send('Invalid token');
        return;
      }
    
      // Set the updated access token in the response cookies
      reply.setCookie('access-token', accessToken, {
        path: '/',
        httpOnly: true,
        maxAge: 3600,
      });
  
      reply.setCookie('user-id', userId, {
        path: '/',
        httpOnly: true,
        maxAge: 3600,
      });
  
    } catch (error: any) {
      reply.code(500).send('Internal server error');
    }
  };