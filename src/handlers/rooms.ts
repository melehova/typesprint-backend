import { FastifyRequest, FastifyReply, FastifyBaseLogger } from 'fastify';
import cacheManager from '../utils/cacheManager';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    // Create Room
    const roomId = uuidv4();
    await cacheManager.createRoom(roomId, userId!);
    reply.send({ roomId });
};

export const joinRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    const { roomId } = request.params! as { roomId: string };
    // Add member to room
    const added = await cacheManager.addMember(roomId, userId!);
    if (added) {
        reply.code(201).send('User successfuly joined room');
    }
    reply.code(208).send('User has already joined the room');
}

export const deleteRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    const { roomId } = request.params! as { roomId: string };

    await cacheManager.deleteRoom(roomId, userId!);
    reply.code(204);
}