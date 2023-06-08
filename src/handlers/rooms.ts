import { FastifyRequest, FastifyReply } from 'fastify';
import cacheManager from '../utils/cacheManager';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    // Create Room
    const roomId = uuidv4();
    await cacheManager.createRoom(roomId, userId!);
    reply.send(roomId);
};
