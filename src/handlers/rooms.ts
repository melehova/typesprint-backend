import { FastifyRequest, FastifyReply } from 'fastify';
import { createRoom as cCreateRoom, addMember, deleteRoom as cDeleteRoom } from '../helpers/room';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    // Create Room
    const roomId = uuidv4();
    await cCreateRoom(roomId, userId!);
    reply.send({ roomId });
};

export const joinRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { 'user-id': userId } = request.cookies!;
    const { roomId } = request.params! as { roomId: string };
    // Add member to room
    const added = await addMember(roomId, userId!);
    if (added) {
        reply.code(201).send({message: 'User successfuly joined room'});
        return
    }
    reply.code(208).send({message: 'User has already joined the room'});
}

export const deleteRoom = async function (request: FastifyRequest, reply: FastifyReply) {
    const { roomId } = request.params! as { roomId: string };

    await cDeleteRoom(roomId);
    reply.code(204);
}