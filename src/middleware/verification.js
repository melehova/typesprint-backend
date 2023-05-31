"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const refreshToken_1 = __importDefault(require("./refreshToken"));
exports.default = async (request, reply, done) => {
    var _a;
    try {
        const access_token = ((_a = request.cookies) === null || _a === void 0 ? void 0 : _a.access_token) || '';
        const tokenExists = await index_1.redis.exists(access_token);
        if (!tokenExists) {
            throw new Error('Unauthorized');
        }
        const accessToken = await (0, refreshToken_1.default)(access_token);
        reply.setCookie('access_token', accessToken, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });
        done();
    }
    catch (error) {
        reply.code(401).send(error);
    }
};
