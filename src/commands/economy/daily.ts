import SlashCommand from 'classes/SlashCommand';
import GlobalVars from 'classes/globalVars';
import { Colors, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Claim your daily reward')
		.setDescriptionLocalizations({
			'pt-BR': 'Resgata sua recompensa diária',
		}),
	async execute({ interaction, memberModel, t }) {
		await interaction.deferReply({ ephemeral: false });

		const lastDaily = memberModel.lastDaily;

		if (areInSameDay(new Date(lastDaily), new Date()))
			return interaction.reply({
				content: t('daily.alreadyClaimed'),
				ephemeral: true,
			});

		memberModel.lastDaily = new Date();
		const dailyCombo = memberModel.dailyCombo * 5;
		const newCoins = Math.round(GlobalVars.dailyCoins + dailyCombo);

		memberModel.wallet += newCoins;
		if (memberModel.dailyCombo < 10) memberModel.dailyCombo++;
		await memberModel.save();

		const embed = new EmbedBuilder()
			.setTitle(t('daily.title'))
			.setColor(Colors.Green)
			.setDescription(
				t('daily.description', {
					newCoins,
					dailyCombo,
					coinEmoji: GlobalVars.coinEmoji,
					coinName: GlobalVars.coinName,
				}),
			);

		interaction.editReply({ embeds: [embed] });
	},
});

const areInSameDay = (d1: Date, d2: Date): boolean =>
	d1.getFullYear() === d2.getFullYear() &&
	d1.getMonth() === d2.getMonth() &&
	d1.getDate() === d2.getDate();
