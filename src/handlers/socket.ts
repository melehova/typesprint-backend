import { Server, Socket } from 'socket.io';
import { addMember, getRoomInfo, removeMember, validateRoom, isUserHost, shiftHost, startGame } from '../helpers/room';
import cookie from 'cookie';

export const roomHandler = (io: Server, socket: Socket): void => {
    const { 'user-id': userId, 'access-token': accessToken } = cookie.parse(socket.handshake.headers.cookie!);


    socket.on('joinRoom', async (roomId: string) => {

        if (!(await validateRoom(roomId))) {
            socket.emit('invalidRoom');
        } else {
            try {
                const added = await addMember(roomId, userId, accessToken);
                if (added === -1) {
                    return socket.emit('gameIsAlreadyStarted');
                }
            } catch (error) {
                return socket.emit('authError');
            }
            socket.join(roomId);

            const roomInfo = await getRoomInfo(roomId);
            io.in(roomId).emit('roomMembersUpdate', roomInfo);
        }


        socket.on('disconnect', async () => {
            leaveRoomEventHandler(io, socket, roomId, userId);
        })
    })

    socket.on('gameStart', async (roomId: string) => {
        // TODO
        await startGame(roomId, userId);
        // get words
        // send words and updated room info
    })

};

const leaveRoomEventHandler = async (io: Server, socket: Socket, roomId: string, userId: string) => {
    socket.leave(roomId);
    await removeMember(roomId, userId);

    if (await isUserHost(roomId, userId)) {
        await shiftHost(roomId);
    }

    const roomInfo = await getRoomInfo(roomId);
    io.in(roomId).emit('roomMembersUpdate', roomInfo);
}