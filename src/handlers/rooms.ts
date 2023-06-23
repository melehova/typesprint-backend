import { FastifyRequest, FastifyReply } from 'fastify';
import { createRoom as cCreateRoom, deleteRoom } from '../helpers/room';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    // Create Room
    const roomId = uuidv4();
    await cCreateRoom(roomId, userId!);
    reply.send({ roomId });
};
