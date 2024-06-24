import { SubCommand } from 'classes/SubCommand';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	Events,
	GuildMember,
	SlashCommandSubcommandBuilder,
} from 'discord.js';

export default new SubCommand({
	data: new SlashCommandSubcommandBuilder()
		.setName('welcome-channel')
		.setDescription('Configure the welcome channel for the server')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel to send welcome messages')
				.addChannelTypes(
					ChannelType.GuildAnnouncement,
					ChannelType.GuildForum,
					ChannelType.GuildStageVoice,
					ChannelType.GuildText,
					ChannelType.GuildVoice,
				)
				.setRequired(false),
		),
	async execute({ client, interaction, guildModel }) {
		const channel = interaction.options.getChannel('channel', false);

		if (!channel) {
			if (!guildModel.welcomeChannel)
				return interaction.reply({
					content: 'Currently, there is no welcome channel set.',
					ephemeral: true,
				});

			const currentChannel = interaction.guild.channels.cache.get(
				guildModel.welcomeChannel,
			);
			return interaction.reply({
				content: `The current welcome channel is ${currentChannel.toString()}`,
				ephemeral: true,
			});
		}

		guildModel.welcomeChannel = channel.id;
		await guildModel.save();

		const testButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('test-welcome')
				.setLabel('Test Join')
				.setStyle(ButtonStyle.Primary),
		);

		const reply = await interaction.reply({
			content:
				`The welcome channel has been set to ${channel.toString()}` +
				'\nPress the button below to test the welcome message',
			components: [testButton],
			ephemeral: true,
		});

		reply
			.createMessageComponentCollector({
				filter: (i) => i.customId === 'test-welcome',
				time: 60_000,
			})
			.on('collect', async (buttonInt) => {
				client.emit(
					Events.GuildMemberAdd,
					interaction.member as GuildMember,
				);
				buttonInt.reply({ content: 'Test message sent!', ephemeral: true });
			});
	},
});
