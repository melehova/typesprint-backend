"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const fastify_1 = __importDefault(require("fastify"));
const client_1 = require("@redis/client");
const cookie_1 = __importDefault(require("@fastify/cookie"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const verification_1 = __importDefault(require("./middleware/verification"));
dotenv_1.default.config();
const server = (0, fastify_1.default)();
server.register(cookie_1.default, {
    secret: "secret",
    parseOptions: {}
});
server.get('/login', async (request, reply) => {
    const redirectUri = `http://${process.env.HOST}:${process.env.PORT}/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email&prompt=select_account`;
    reply.redirect(authUrl);
});
server.get('/callback', async (request, reply) => {
    try {
        const { code } = request.query;
        // Exchange authorization code for access token
        const tokenResponse = await axios_1.default.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `http://${process.env.HOST}:${process.env.PORT}/callback`,
            grant_type: 'authorization_code',
        });
        const { access_token } = tokenResponse.data;
        const response = await axios_1.default.get('https://oauth2.googleapis.com/tokeninfo', {
            params: { access_token },
        });
        const { data: { sub: userId, expires_in } } = response;
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = +expires_in + now;
        // Store the access token in Redis
        await exports.redis.set(access_token, JSON.stringify({ userId, expiresAt }));
        // Set the access token as a cookie
        reply.setCookie('access_token', access_token, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
        });
        reply.send({ message: 'OAuth callback successful' });
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        reply.code(500).send({ error: 'OAuth callback failed' });
    }
});
server.get('/logout', async (request, reply) => {
    try {
        const { access_token } = request.cookies;
        // Remove user data from Redis
        await exports.redis.del(access_token || '');
        reply.clearCookie('access_token');
        reply.send({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        reply.code(500).send({ error: 'Logout failed' });
    }
});
server.get('/', { preHandler: verification_1.default }, (request) => 'boom');
server.get('/ping', () => 'pong\n');
exports.redis = (0, client_1.createClient)({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PWD,
});
const start = async () => {
    try {
        await exports.redis.connect();
        exports.redis.on('error', (err) => console.error('Redis error:', err));
        server.listen({ port: process.env.PORT }, (_, address) => {
            console.log(`Server is running at: ${address}`);
        });
        console.log('Connected to redis');
    }
    catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};
start();
