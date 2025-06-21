import { SubCommand } from 'classes/SubCommand';
import { XpRepo } from 'db/repositories';
import { MoreThan } from 'typeorm';
import { SlashCommandSubcommandBuilder } from 'discord.js';

export default new SubCommand({
	data: new SlashCommandSubcommandBuilder()
		.setName('chat')
		.setDescription('XP Rank for chat messages')
		.setDescriptionLocalizations({
			'pt-BR': 'Rank de XP por mensagens no chat',
		})
		.addStringOption((option) =>
			option
				.setName('time')
				.setDescriptionLocalizations({
					'pt-BR': 'Período de tempo',
				})
				.setChoices([
					{
						name_localizations: { 'pt-BR': 'Hoje' },
						name: 'Today',
						value: '1',
					},
					{
						name_localizations: { 'pt-BR': '7 dias' },
						name: '7 days',
						value: '7',
					},
					{
						name_localizations: { 'pt-BR': '30 dias' },
						name: '30 days',
						value: '30',
					},
					{
						name_localizations: { 'pt-BR': '3 meses' },
						name: '3 months',
						value: '90',
					},
					{
						name_localizations: { 'pt-BR': '12 meses' },
						name: '12 months',
						value: '365',
					},
				])
				.setRequired(false),
		),

	execute: async ({ client, interaction }) => {
		const timeString = interaction.options.getString('time', false) || '30';
		const today = new Date(new Date().setHours(0, 0, 0, 0));

		const pastDate = new Date(today);
		pastDate.setDate(today.getDate() - parseInt(timeString, 10));

		const entries = await XpRepo.find({
			where: { day: MoreThan(pastDate) },
			order: { chatXP: 'DESC' },
		});

        
	},
});
