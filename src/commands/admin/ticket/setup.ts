import { SubCommand } from 'classes/SubCommand';
import { Ticket } from 'db/entities';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	SlashCommandSubcommandBuilder,
} from 'discord.js';
import { consoleError } from 'utils/log';

export default new SubCommand({
	data: Data(),

	async execute({ interaction, t }) {
		try {
			const messageId = interaction.options.getString('message-id');

			const modChannel = interaction.options.getChannel('mod-channel');

			const assignRole = interaction.options.getRole('assign-role', false);

			const createChatCategory =
				interaction.options.getChannel('create-chat-category', false)?.id ||
				null;

			const approvedChannelId =
				interaction.options.getChannel('approved-channel', false)?.id ||
				null;

			const approvedMessage =
				interaction.options.getString('approved-message', false) || null;

			const buttonText =
				interaction.options.getString('button-text', false) ||
				'Criar Ticket';

			const buttonEmoji =
				interaction.options.getString('button-emoji', false) || '🎮';

			const buttonStyleString =
				interaction.options.getString('button-color', false) || 'Primary';

			const buttonStyle =
				ButtonStyle[buttonStyleString as keyof typeof ButtonStyle];

			const message = await interaction.channel.messages.fetch(messageId);

			if (!message)
				return interaction.reply({
					content: t('ticket:setup.messageNotFound'),
					ephemeral: true,
				});

			if (
				message.author.id !== interaction.client.user.id ||
				!message.editable
			)
				return interaction.reply({
					content: t('ticket:setup.notBotMessage'),
					ephemeral: true,
				});

			if (!buttonEmoji.match(/<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu))
				return interaction.reply({
					content: t('ticket:setup.invalidEmoji'),
					ephemeral: true,
				});

			const ticket = new Ticket();
			ticket.messageId = messageId;
			ticket.modChannel = modChannel.id;
			ticket.assignRole = assignRole?.id;
			ticket.approvalChannel = approvedChannelId;
			ticket.approvalMessage = approvedMessage;
			ticket.createChatCategory = createChatCategory;
			await ticket.save();

			const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`ticket-create-${ticket.id}`)
					.setEmoji(buttonEmoji)
					.setLabel(buttonText)
					.setStyle(buttonStyle),
			);

			await message.edit({ components: [buttons] });

			interaction.reply({
				embeds: [
					{
						title: t('ticket:setup.title'),
						description: t('ticket:setup.description', { messageId }),
					},
				],
				ephemeral: true,
			});

			if ('send' in modChannel)
				modChannel.send({
					content: t('ticket:setup.modChannelMessage', {}),
				});
		} catch (err) {
			consoleError('TICKET:SETUP', err);
		}
	},
});

function Data() {
	const data = new SlashCommandSubcommandBuilder()
		.setName('setup')
		.setDescription('Set a modal based ticket system')
		.addStringOption((option) =>
			option
				.setName('message-id')
				.setDescription('Bot message to add the button')
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName('mod-channel')
				.setDescription('where responses will be sent for moderation')
				.addChannelTypes(
					ChannelType.GuildAnnouncement,
					ChannelType.GuildForum,
					ChannelType.GuildStageVoice,
					ChannelType.GuildText,
					ChannelType.GuildVoice,
				)
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName('approved-channel')
				.setDescription('Channel to notify when the ticket is approved')
				.setRequired(true)
				.addChannelTypes(
					ChannelType.GuildAnnouncement,
					ChannelType.GuildForum,
					ChannelType.GuildStageVoice,
					ChannelType.GuildText,
					ChannelType.GuildVoice,
				),
		)
		.addStringOption((option) =>
			option
				.setName('approved-message')
				.setDescription(
					'Message to send when the ticket is approved. use {user} to mention the user',
				)
				.setMaxLength(1000)
				.setRequired(false),
		)
		.addRoleOption((option) =>
			option
				.setName('assign-role')
				.setDescription('Role to assign to the user')
				.setRequired(false),
		)
		.addChannelOption((option) =>
			option
				.setName('create-chat-category')
				.setDescription('Category to create the ticket chat')
				.setRequired(false)
				.addChannelTypes(ChannelType.GuildCategory),
		)
		.addStringOption((option) =>
			option
				.setName('button-text')
				.setDescription('Text to show in the button')
				.setMaxLength(80)
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('button-emoji')
				.setDescription('Emoji to show in the button')
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('button-color')
				.setDescription('Color of the button')
				.setChoices([
					{ name: 'Green', value: 'Success' },
					{ name: 'Red', value: 'Danger' },
					{ name: 'Blue', value: 'Primary' },
					{ name: 'Gray', value: 'Secondary' },
				])
				.setRequired(false),
		);

	return data;
}
