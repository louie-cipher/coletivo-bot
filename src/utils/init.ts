import { Client } from 'discord.js';
import { consoleError, consoleLog } from './log';
import { initDB } from '../db';
import { GuildRepo } from 'db/repositories';
import { loadCommands, loadEvents } from './loader';
import GlobalVars from 'classes/globalVars';

export async function init(client: Client) {
	try {
		consoleLog('INIT', 'Initializing bot...');
		await initDB();

		const guildDB = await GuildRepo.findOrCreate();

		GlobalVars.setLanguage(guildDB.language);
		GlobalVars.setCoinEmoji(guildDB.coinEmoji);
		GlobalVars.setCoinName(guildDB.coinName);
		GlobalVars.setInvisibleEmoji(guildDB.invisibleEmoji);
		GlobalVars.setDailyCoins(guildDB.dailyCoins);
		GlobalVars.setChatXP(guildDB.chatXP);
		GlobalVars.setVoiceXP(guildDB.voiceXP);
		GlobalVars.setChatXPCooldown(guildDB.chatXPInterval);
		GlobalVars.setVoiceXPInterval(guildDB.voiceXPInterval);

		await loadCommands();
		loadEvents();
		await client.login(process.env.BOT_TOKEN);
	} catch (err) {
		consoleError('INIT', err);
	}
}
