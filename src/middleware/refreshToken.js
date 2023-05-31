"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
exports.default = async (refreshToken) => {
    try {
        const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });
        const { access_token, expires_in } = response.data;
        const tokenInfo = JSON.parse(await index_1.redis.get(refreshToken) || '');
        const { userId } = tokenInfo;
        await index_1.redis.del(refreshToken);
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = expires_in + now;
        await index_1.redis.set(access_token, JSON.stringify({ userId, expiresAt }));
        return access_token;
    }
    catch (error) {
        throw new Error('Token refresh failed');
    }
};
