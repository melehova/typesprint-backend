import { Socket } from 'socket.io';
import { addMember, getRoomInfo } from '../helpers/room';
import cookie from 'cookie';

export const roomHandler = (socket: Socket): void => {
    socket.on('createRoom', async (roomId: string) => {
        const roomInfo = await getRoomInfo(roomId);
        socket.emit('roomCreated', roomInfo);
    });

    socket.on('joinRoom', async (roomId: string) => {
        const { 'user-id': userId, 'access-token': accessToken } = cookie.parse(socket.handshake.headers.cookie!);

        await addMember(roomId, userId, accessToken);
        const roomInfo = await getRoomInfo(roomId);
        socket.emit('roomJoined', roomInfo);
    })
};
