import SlashCommand from 'classes/SlashCommand';
import { SlashCommandBuilder } from 'discord.js';
import { SubCommandType } from 'types/SubCommand';
import setup from './ticket/setup';
import unblock from './ticket/unblock';
import questions from './ticket/questions';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('ticket')
		.setDescription('ticket system')
		.setDefaultMemberPermissions(8)
		.addSubcommand((setup as SubCommandType).data)
		.addSubcommand((unblock as SubCommandType).data)
		.addSubcommand((questions as SubCommandType).data),

	async execute(options) {
		const subcommand = options.interaction.options.getSubcommand();

		switch (subcommand) {
			case 'setup':
				return (setup as SubCommandType).execute(options);
			case 'unblock':
				return (unblock as SubCommandType).execute(options);
			case 'questions':
				return (questions as SubCommandType).execute(options);
		}
	},
});
