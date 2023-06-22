import { Server, Socket } from 'socket.io';
import { addMember, getRoomInfo, removeMember, validateRoom } from '../helpers/room';
import cookie from 'cookie';

export const roomHandler = (io: Server, socket: Socket): void => {

    socket.on('joinRoom', async (roomId: string) => {
        const { 'user-id': userId, 'access-token': accessToken } = cookie.parse(socket.handshake.headers.cookie!);

        if (!(await validateRoom(roomId))) {
            socket.emit('invalidRoom');
        } else {
            try {
                await addMember(roomId, userId, accessToken);
            } catch (error) {
                socket.emit('authError');
            }
            socket.join(roomId);

            const roomInfo = await getRoomInfo(roomId);
            io.in(roomId).emit('roomMembersUpdate', roomInfo);
        }


        socket.on('disconnect', async () => {
            leaveRoomEventHandler(io, socket, roomId, userId);
        })
    })


};

const leaveRoomEventHandler = async (io: Server, socket: Socket, roomId: string, userId: string) => {
    socket.leave(roomId);
    await removeMember(roomId, userId);
    // TODO
    // check if room is empty and delete if true

    // check if user host and shift host if true

    const roomInfo = await getRoomInfo(roomId);
    io.in(roomId).emit('roomMembersUpdate', roomInfo);
}