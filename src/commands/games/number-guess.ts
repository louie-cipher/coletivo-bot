import SlashCommand from 'classes/SlashCommand';
import { Colors, SlashCommandBuilder } from 'discord.js';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('number-guess')
		.setDescription('Guess the random number')
		.setNameLocalizations({
			'pt-BR': 'adivinhar-numero',
		})
		.setDescriptionLocalizations({
			'pt-BR': 'Adivinhe o número aleatório',
		})
		.addIntegerOption((option) =>
			option
				.setName('max')
				.setDescription('The maximum random number')
				.setDescriptionLocalizations({
					'pt-BR': 'O número aleatório máximo',
				})
				.setRequired(false),
		),

	async execute({ interaction, t }) {
		const max = interaction.options.getInteger('max') || 100;
		interaction.reply({
			embeds: [
				{
					title: t('numberGuess.title'),
					description: t('numberGuess.description', { max }),
					color: Colors.Yellow,
				},
			],
		});

		const targetNumber = Math.floor(Math.random() * max) + 1;
		let attempts = 0;

		const collector = interaction.channel.createMessageCollector({
			filter: (msg) => !isNaN(parseInt(msg.content, 10)),
			idle: 60_000,
		});

		collector.on('collect', (message) => {
			const number = parseInt(message.content);
			attempts++;

			if (number === targetNumber) {
				collector.stop();
				return message.reply({
					embeds: [
						{
							title: t('numberGuess.win'),
							description: t('numberGuess.attempts', { attempts }),
							color: Colors.Green,
						},
					],
				});
			}

			message.reply({
				content: t(
					number > targetNumber
						? 'numberGuess.lower'
						: 'numberGuess.higher',
				),
			});
		});
	},
});
