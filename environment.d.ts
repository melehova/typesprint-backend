declare global {
    namespace NodeJS {
        interface ProcessEnv {
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;
            PORT: number;
            HOST: string;
            CLIENT_HOST: string;
            CLIENT_PORT: number;
            REDIS_HOST: string;
            REDIS_PORT: number;
            REDIS_PWD: string;
    }
}
}

export { }