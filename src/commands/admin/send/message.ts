import { SubCommand } from 'classes/SubCommand';
import {
	ChannelType,
	GuildChannel,
	SlashCommandSubcommandBuilder,
} from 'discord.js';

export default new SubCommand({
	data: new SlashCommandSubcommandBuilder()
		.setName('message')
		.setDescription('send a message to a channel')
		.addStringOption((option) =>
			option
				.setName('message')
				.setDescription('message to send')
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('channel to send the message')
				.addChannelTypes(
					ChannelType.GuildText,
					ChannelType.GuildVoice,
					ChannelType.GuildAnnouncement,
					ChannelType.PublicThread,
					ChannelType.PrivateThread,
				)
				.setRequired(false),
		),

	async execute({ interaction, t }) {
		const channel = (interaction.options.getChannel('channel', false) ||
			interaction.channel) as GuildChannel;
		const text = interaction.options.getString('message');

		if (!channel.isTextBased())
			return interaction.reply({
				content: t('send.invalid_channel'),
				ephemeral: true,
			});

		const message = await channel.send(text);

		interaction.reply({
			content: t('send.success').replace('{{message}}', message.url),
			ephemeral: true,
		});
	},
});
