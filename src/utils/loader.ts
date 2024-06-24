import { ApplicationCommandDataResolvable, Collection, Guild } from 'discord.js';
import { readFileSync, readdirSync } from 'fs';
import { consoleError, consoleLog } from './log';
import { SlashCommandType } from 'classes/SlashCommand';
import { GuildRepo } from 'db/repositories';
import GlobalVars from 'classes/globalVars';

const commandsToAPI: ApplicationCommandDataResolvable[] = [];
export const commands = new Collection<string, SlashCommandType>();

const importFile = async (path: string) => (await import(path)).default;

export async function loadCommands() {
	const baseDir = `${__dirname}/../commands/`;

	const commandsDir = readdirSync(baseDir, { withFileTypes: true });

	for (const category of commandsDir) {
		const categoryDir = readdirSync(
			`${__dirname}/../commands/${category.name}`,
		).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

		for (const file of categoryDir) {
			const command: SlashCommandType = await importFile(
				`${baseDir}/${category.name}/${file}`,
			);
			if (!command || !command.data) continue;
			commands.set(command.data.name, command);
			commandsToAPI.push(command.data.toJSON());
		}
	}
	consoleLog('LOADER:COMMANDS', `${commands.size} commands loaded`);
}

export function registerCommandsInAPI(guild: Guild) {
	guild.commands.set(commandsToAPI);
	consoleLog('LOADER:COMMANDS', 'Commands registered in API');
}

export function loadEvents() {
	const files = readdirSync(`${__dirname}/../events`).filter(
		(file) => file.endsWith('.js') || file.endsWith('.ts'),
	);
	files.forEach((file) => import(`../events/${file}`));
	consoleLog('LOADER:EVENTS', `${files.length} Events loaded!`);
}
export async function registerEmojis(guild: Guild) {
	const guildDB = await GuildRepo.findOrCreate();

	if (guild.emojis.cache.find((emoji) => emoji.name === 'invisible'))
		return GlobalVars.setInvisibleEmoji(guildDB.invisibleEmoji);

	const invisible = readFileSync(`${process.cwd()}/assets/images/invisible.png`);

	try {
		const emoji = await guild.emojis.create({
			name: 'invisible',
			attachment: invisible,
		});
		consoleLog('LOADER:EMOJI', `Emoji '${emoji.name}' created`);

		guildDB.invisibleEmoji = `<:${emoji.name}:${emoji.id}>`;
		await guildDB.save();

		consoleLog('LOADER:EMOJI', `Emoji '${emoji.name}' saved at database`);

		GlobalVars.setInvisibleEmoji(guildDB.invisibleEmoji);
	} catch (err) {
		consoleError('LOADER:EMOJI', err);
	}
}
