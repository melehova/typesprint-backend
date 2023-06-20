import cacheManager from "../utils/cacheManager"
import { GAME_STATE } from "../gamestates";

export const createRoom = async (roomId: string, userId: string) => {
    try {
        await cacheManager.hset(`room:${roomId}`, 'host', userId);
        await cacheManager.hset(`room:${roomId}`, 'state', GAME_STATE.LOBBY);
        await addMember(roomId, userId);
    } catch (error) {
        throw new Error('Error creating room');
    }
}

export const validateRoom = async (roomId: string): Promise<number> => {
    return await cacheManager.redis.exists(`room:${roomId}`);
}

export const addMember = async (roomId: string, userId: string): Promise<number> => {
    try {
        return await cacheManager.sadd(`roomPlayers:${roomId}`, userId);
    } catch (error) {
        throw new Error('Error joining room');
    }
}

export const deleteRoom = async (roomId: string) => {
    try {
        await cacheManager.del(`roomPlayers:${roomId}`);
        await cacheManager.del(`room:${roomId}`);
    } catch (error) {
        throw new Error('Error deleting room');
    }
}

export const accessToRoom = async (roomId: string, userId: string) => {
    const host = await cacheManager.hget(`room:${roomId}`, 'host');
    return (host === userId);
}

export const shiftHost = async (roomId: string) => {
    // Check if room is not empty
    const key = `roomPlayers:${roomId}`;
    if (await cacheManager.redis.sCard(key) - 1) {
        const newHostId = await cacheManager.redis.sRandMember(key);
        await cacheManager.hset(`room:${roomId}`, 'host', newHostId);
        return newHostId;
    }
    await deleteRoom(roomId);
}

export const removeMember = (roomId: string, userId: string) => {
    // Delete user from roomPlayers
    // TODO
}
