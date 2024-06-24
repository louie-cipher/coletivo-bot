import SlashCommand from 'classes/SlashCommand';
import { SlashCommandBuilder } from 'discord.js';
import embed from './send/embed';
import message from './send/message';
import { SubCommandType } from 'types/SubCommand';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('send')
		.setDescription('send a message to a channel')
		.setDefaultMemberPermissions(8)
		.addSubcommand((embed as SubCommandType).data)
		.addSubcommand((message as SubCommandType).data),

	async execute(options) {
		const subcommand = options.interaction.options.getSubcommand();

		switch (subcommand) {
			case 'embed':
				return (embed as SubCommandType).execute(options);
			case 'message':
				return (message as SubCommandType).execute(options);
		}
	},
});
