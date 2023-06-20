import { FastifyRequest, FastifyReply } from 'fastify';
import {validateRoom as cValidateRoom, accessToRoom as cAccessToRoom } from '../helpers/room';

export const validateRoom = async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { roomId } = request.params! as { roomId: string };
    // check room existence
    if (!(await cValidateRoom(roomId))) {
        reply.code(404).send({ error: "Room not found" });
    }
}

export const accessToRoom = async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { 'user-id': userId } = request.cookies!;
    const { roomId } = request.params! as { roomId: string };
    // check if user is host
    if (!(await cAccessToRoom(roomId, userId!))) {
        reply.code(403).send({ error: "You are not allowed to control this room" });
    }
}
