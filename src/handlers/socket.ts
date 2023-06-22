import { Server, Socket } from 'socket.io';
import { addMember, getRoomInfo } from '../helpers/room';
import cookie from 'cookie';

export const roomHandler = (io: Server, socket: Socket): void => {

    socket.on('createRoom', async (roomId: string) => {
        socket.join(roomId);

        const roomInfo = await getRoomInfo(roomId);
        io.in(roomId).emit('roomCreated', roomInfo);
    });

    socket.on('joinRoom', async (roomId: string) => {
        const { 'user-id': userId, 'access-token': accessToken } = cookie.parse(socket.handshake.headers.cookie!);

        await addMember(roomId, userId, accessToken);
        socket.join(roomId);

        const roomInfo = await getRoomInfo(roomId);
        io.in(roomId).emit('roomJoined', roomInfo);
    })
};
