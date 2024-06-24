import { SubCommand } from 'classes/SubCommand';
import {
	ActionRowBuilder,
	ChannelType,
	ColorResolvable,
	EmbedBuilder,
	Message,
	ModalBuilder,
	SlashCommandSubcommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { consoleError } from 'utils/log';

export default new SubCommand({
	data: new SlashCommandSubcommandBuilder()
		.setName('embed')
		.setDescription('send an embed to a channel')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('channel to send the embed')
				.addChannelTypes(
					ChannelType.GuildAnnouncement,
					ChannelType.GuildForum,
					ChannelType.GuildStageVoice,
					ChannelType.GuildText,
					ChannelType.GuildVoice,
				)
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('message-edit')
				.setDescription('message id to edit')
				.setRequired(false),
		),

	async execute({ interaction, t }) {
		const channel =
			interaction.options.getChannel('channel', false) || interaction.channel;

		const messageId = interaction.options.getString('message-edit', false);
		let message: Message<true> | undefined | void;

		if (!('send' in channel))
			return interaction.reply({
				content: t('send.invalid_channel'),
				ephemeral: true,
			});

		if (messageId) {
			message = await channel.messages.fetch(messageId).catch((err) => {
				consoleError('CMD:SEND:EMBED', err);
				interaction.reply({
					content: t('send.invalid_message_id'),
					ephemeral: true,
				});
			});
		}

		const textInputs: TextInputBuilder[] = [
			new TextInputBuilder({
				custom_id: 'content',
				label: t('send.embed.content'),
				placeholder: t('send.embed.content_placeholder'),
				max_length: 2000,
				style: TextInputStyle.Paragraph,
				required: false,
			}),
			new TextInputBuilder({
				custom_id: 'title',
				label: t('send.embed.title'),
				placeholder: t('send.embed.title_placeholder'),
				min_length: 1,
				max_length: 256,
				style: TextInputStyle.Short,
				required: true,
			}),
			new TextInputBuilder({
				custom_id: 'description',
				label: t('send.embed.description'),
				placeholder: t('send.embed.description_placeholder'),
				max_length: 4000,
				style: TextInputStyle.Paragraph,
				required: false,
			}),
			new TextInputBuilder({
				custom_id: 'color',
				label: t('send.embed.color'),
				placeholder: t('send.embed.color_placeholder'),
				style: TextInputStyle.Short,
				required: false,
			}),
			new TextInputBuilder({
				custom_id: 'image',
				label: t('send.embed.image'),
				placeholder: t('send.embed.image_placeholder'),
				style: TextInputStyle.Short,
				required: false,
			}),
		];
		const rows: ActionRowBuilder<TextInputBuilder>[] = [];

		textInputs.forEach((input) => {
			rows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
		});

		const modal = new ModalBuilder()
			.setTitle(t('send.embed.modal_title'))
			.setCustomId(`send_embed_${interaction.id}`)
			.addComponents(...rows);

		await interaction.showModal(modal);

		const modalInteraction = await interaction.awaitModalSubmit({
			time: 600_000, // 10 minutes
			filter: (int) => int.customId === `send_embed_${interaction.id}`,
		});

		const content = modalInteraction.fields.getTextInputValue('content');
		const title = modalInteraction.fields.getTextInputValue('title');
		const description = modalInteraction.fields.getTextInputValue('description');
		const color = modalInteraction.fields.getTextInputValue('color');
		const image = modalInteraction.fields.getTextInputValue('image');

		const embed = new EmbedBuilder().setTitle(title);

		if (description) embed.setDescription(description);
		if (image) embed.setImage(image);
		if (color && /^#([A-Fa-f0-9]{6})$/.test(color))
			embed.setColor(color as ColorResolvable);

		if (message) {
			message.edit({ embeds: [embed], content: content });
			return modalInteraction.reply({
				content: t('send.success_edit').replace('{{message}}', message.url),
				ephemeral: true,
			});
		}

		channel
			.send({ embeds: [embed], content: content })
			.then((msg) => {
				modalInteraction.reply({
					content: t('send.success').replace('{{message}}', msg.url),
					ephemeral: true,
				});
			})
			.catch((err) =>
				modalInteraction.reply({
					embeds: [
						{
							title: t('send.error'),
							description: '```\n' + `${err}`.slice(0, 4000) + '\n```',
						},
					],
					ephemeral: true,
				}),
			);
	},
});
