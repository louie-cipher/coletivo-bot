import { SubCommand } from 'classes/SubCommand';
import {
	ChannelType,
	GuildChannel,
	SlashCommandSubcommandBuilder,
} from 'discord.js';

export default new SubCommand({
	data: new SlashCommandSubcommandBuilder()
		.setName('message')
		.setNameLocalizations({
			'pt-BR': 'mensagem',
		})
		.setDescription('send a message to the channel through the bot')
		.setDescriptionLocalizations({
			'pt-BR': 'envia uma mensagem no canal pelo bot',
		})
		.addStringOption((option) =>
			option
				.setName('message')
				.setDescription('message to send')
				.setDescriptionLocalizations({
					'pt-BR': 'mensagem para enviar',
				})
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('message-edit-id')
				.setDescription('message id to edit')
				.setDescriptionLocalizations({
					'pt-BR': 'id da mensagem para editar',
				})
				.setRequired(false),
		),

	async execute({ interaction, t }) {
		const channel = interaction.channel;
		const text = interaction.options.getString('message');
		const messageEditId = interaction.options.getString('message-edit-id');

		if (messageEditId) {
			try {
				const message = await channel.messages.fetch(messageEditId);

				if (message.author.id !== interaction.client.user.id)
					return interaction.reply({
						content: t('send.invalid_message_id'),
						ephemeral: true,
					});

				await message.edit(text);

				return interaction.reply({
					content: t('send.success_edit').replace(
						'{{message}}',
						message.url,
					),
					ephemeral: true,
				});
			} catch (err) {
				return interaction.reply({
					content: t('send.error'),
					ephemeral: true,
				});
			}
		}

		const message = await channel.send(text);

		interaction.reply({
			content: t('send.success').replace('{{message}}', message.url),
			ephemeral: true,
		});
	},
});
