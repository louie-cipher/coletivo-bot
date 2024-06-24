declare global {
	namespace NodeJS {
		interface ProcessEnv {
			BOT_TOKEN: string;
			NODE_ENV: 'dev' | 'prod' | 'debug';
			GUILD_ID: string;
		}
	}
}

export {};
