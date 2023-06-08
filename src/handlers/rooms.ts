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
    // check room existence
    if (!(await cacheManager.validateRoom(roomId))) {
        return reply.code(404).send({ error: "Room not found" });
    }
    // Add member to room
    const added = await cacheManager.addMember(roomId, userId!);

    reply.code(added ? 201 : 208).send(added ? 'User successfuly joined room' : 'User has already joined the room');
}