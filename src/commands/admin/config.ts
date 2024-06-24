import SlashCommand from 'classes/SlashCommand';
import { SlashCommandBuilder } from 'discord.js';
import welcomeChannel from './config/welcome-channel';
import { SubCommandType } from 'types/SubCommand';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Configure the bot')
		.setDefaultMemberPermissions(8)
		.addSubcommand((welcomeChannel as SubCommandType).data),

	async execute(options) {
		const subcommand = options.interaction.options.getSubcommand();

		switch (subcommand) {
			case 'welcome-channel':
				return (welcomeChannel as SubCommandType).execute(options);
		}
	},
});
