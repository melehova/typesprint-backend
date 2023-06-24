import cacheManager from "../utils/cacheManager"
import { GAME_STATE } from "../gamestates";
import { getProfileData } from "./user";
import axios from "axios";

export const createRoom = async (roomId: string, userId: string) => {
    try {
        await cacheManager.hset(`room:${roomId}`, 'host', userId);
        await cacheManager.hset(`room:${roomId}`, 'state', GAME_STATE.LOBBY);
    } catch (error) {
        throw new Error('Error creating room');
    }
}

export const validateRoom = async (roomId: string): Promise<number> => {
    return await cacheManager.redis.exists(`room:${roomId}`);
}

export const addMember = async (roomId: string, userId: string, accessToken: string): Promise<number> => {
    try {
        const state = await cacheManager.hget(`room:${roomId}`, 'state');
        if (state !== GAME_STATE.LOBBY) {
            return -1;
        }
        const { name, photo } = await getProfileData(accessToken);
        return await cacheManager.hset(`roomPlayers:${roomId}`, userId, { userId, name, photo });
    } catch (error: any) {
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
    const key = `roomPlayers:${roomId}`;

    if (await cacheManager.redis.hLen(key)) {
        const newHostId = await cacheManager.redis.hRandField(key);
        await cacheManager.hset(`room:${roomId}`, 'host', newHostId);
        return newHostId;
    }
    await deleteRoom(roomId);
}

export const removeMember = async (roomId: string, userId: string) => {
    return await cacheManager.hdel(`roomPlayers:${roomId}`, userId);
}

export const getRoomInfo = async (roomId: string) => {
    const members = await cacheManager.hgetall(`roomPlayers:${roomId}`);
    const room = await cacheManager.hgetall(`room:${roomId}`);
    return { members, ...room, id: roomId }
}

export const isUserHost = async (roomId: string, userId: string) => {
    return await cacheManager.hget(`room:${roomId}`, 'host') === userId
}

export const startGame = async (roomId: string, userId: string) => {
    if (!await accessToRoom(roomId, userId)) {
        return -1;
    }
    return await cacheManager.hset(`room:${roomId}`, 'state', GAME_STATE.ACTIVE);
}

export const fetchWords = async (timerDuration = 60000) => {
    const { data } = await axios.get(process.env.WORDS_API_URL, {
        params: {
            words: timerDuration / 1000
        }
    });

    return [...new Set(data)];
}