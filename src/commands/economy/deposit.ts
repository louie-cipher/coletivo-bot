import SlashCommand from 'classes/SlashCommand';
import GlobalVars from 'classes/globalVars';
import { Colors, SlashCommandBuilder } from 'discord.js';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('deposito')
		.setDescription('Deposita suas moedas no banco')
		.addIntegerOption((option) =>
			option
				.setName('valor')
				.setDescription('Quantidade de moedas a depositar')
				.setMinValue(1)
				.setRequired(false),
		),
	async execute({ interaction, memberModel, t }) {
		await interaction.deferReply({ ephemeral: false });

		const amount = interaction.options.getInteger('valor') || memberModel.wallet;

		if (amount > memberModel.wallet)
			return interaction.editReply(
				t('deposit.notEnoughCoins', {
					coinEmoji: GlobalVars.coinEmoji,
					coinName: GlobalVars.coinName,
				}),
			);

		memberModel.wallet -= amount;
		memberModel.bank += amount;

		await memberModel.save();
		interaction.editReply({
			embeds: [
				{
					color: Colors.Green,
					title: t('deposit.successTitle'),
					description: t('deposit.successDescription', {
						amount,
						coinEmoji: GlobalVars.coinEmoji,
						coinName: GlobalVars.coinName,
					}),
				},
			],
		});
	},
});
