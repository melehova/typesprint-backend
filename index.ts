import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { RedisClientType, createClient } from '@redis/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const server = fastify();
let redis: RedisClientType;

server.get('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const redirectUri = `http://${process.env.HOST}:${process.env.PORT}/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email`;
    reply.redirect(authUrl);
});

server.get('/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { code } = request.query as { code?: string };

        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `http://${process.env.HOST}:${process.env.PORT}/callback`,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        // Get user information using the access token
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        // Save user data to Redis
        const user = {
            id: userResponse.data.id,
            email: userResponse.data.email,
            // name: userResponse.data.name,
        };
        await redis.set(`user:${user.id}`, JSON.stringify(user));
        const res = await redis.get(`user:${user.id}`);
        console.log(res);

        // You may also generate and return a JWT token for authentication

        reply.send({ message: 'OAuth callback successful', user });
    } catch (error) {
        console.error('OAuth callback error:', error);
        reply.code(500).send({ error: 'OAuth callback failed' });
    }
});

server.get('/ping', () => 'pong\n');

const start = async () => {
    try {
        redis = createClient({
            url: process.env.REDIS_URL,
            password: process.env.REDIS_PWD,
        });
        await redis.connect();

        redis.on('error', (err) => console.error('Redis error:', err));

        server.listen({ port: process.env.PORT }, (_, address) => {
            console.log(`Server is running at: ${address}`);
        });
        console.log('Connected to redis');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start();