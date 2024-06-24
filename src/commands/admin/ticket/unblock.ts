import { SubCommand } from 'classes/SubCommand';
import { TicketEntry } from 'db/entities';
import { SlashCommandSubcommandBuilder } from 'discord.js';

export default new SubCommand({
	data: new SlashCommandSubcommandBuilder()
		.setName('unblock')
		.setDescription('Unblock a user from the ticket system')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('User to revoke')
				.setRequired(true),
		),

	async execute({ interaction, t }) {
		const user = interaction.options.getUser('user');

		const entries = await TicketEntry.findBy({ userId: user.id, deleted: true });

		if (!entries || entries.length === 0)
			return interaction.reply({
				content: t('ticket:unblock.notFound', { user: user.id }),
				ephemeral: true,
			});

		for (const entry of entries) await entry.remove();

		await interaction.reply({
			content: t('ticket:unblock.success', { user: user.id }),
			ephemeral: true,
		});
	},
});
