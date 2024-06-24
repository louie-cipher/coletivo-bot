import SlashCommand from 'classes/SlashCommand';
import GlobalVars from 'classes/globalVars';
import { Colors, SlashCommandBuilder } from 'discord.js';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('saque')
		.setDescription('Saque suas moedas do banco')
		.addIntegerOption((option) =>
			option
				.setName('valor')
				.setDescription('Quantidade de moedas a sacar')
				.setMinValue(1)
				.setRequired(false),
		),
	async execute({ interaction, memberModel, t }) {
		await interaction.deferReply({ ephemeral: false });

		const amount = interaction.options.getInteger('valor') || memberModel.bank;

		if (amount > memberModel.bank)
			return interaction.editReply(
				t('saque.notEnoughCoins', {
					coinEmoji: GlobalVars.coinEmoji,
					coinName: GlobalVars.coinName,
				}),
			);

		memberModel.wallet += amount;
		memberModel.bank -= amount;

		await memberModel.save();

		interaction.editReply({
			embeds: [
				{
					color: Colors.Green,
					title: t('saque.successTitle'),
					description: t('saque.successDescription', {
						amount,
						coinEmoji: GlobalVars.coinEmoji,
						coinName: GlobalVars.coinName,
					}),
				},
			],
		});
	},
});
