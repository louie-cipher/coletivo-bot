import { consoleLog } from 'utils/log';
import { registerCommandsInAPI } from 'utils/loader';
import { GuildRepo } from 'db/repositories';
import { Events } from 'discord.js';
import client from 'client';
import GlobalVars from 'classes/globalVars';
import voiceXP from 'utils/voiceXP';

client.on(Events.ClientReady, async () => {
	consoleLog('READY', `Logged in as ${client.user?.tag}`);

	const guild = client.guilds.cache.get(process.env.GUILD_ID);

	registerCommandsInAPI(guild);

	await GuildRepo.findOrCreate();

	setInterval(async () => {
		await voiceXP(guild);
	}, GlobalVars.voiceXPInterval * 1000);
});
