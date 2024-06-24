import SlashCommand from 'classes/SlashCommand';
import { Colors, SlashCommandBuilder } from 'discord.js';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription("Get the bot's ping"),

	async execute({ client, interaction, t }) {
		const now = Date.now();
		await interaction.deferReply();

		const msgPing = Date.now() - now;
		const apiPing = client.ws.ping;

		const description =
			t('ping.responseTime', { ping: msgPing }) +
			'\n' +
			t('ping.apiPing', { ping: apiPing });

		interaction.editReply({
			embeds: [{ title: t('ping.title'), description, color: Colors.Aqua }],
		});
	},
});
