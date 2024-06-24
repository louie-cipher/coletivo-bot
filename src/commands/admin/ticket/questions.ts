import { SubCommand } from 'classes/SubCommand';
import { TicketQuestion } from 'db/entities';
import { TicketRepo } from 'db/repositories';
import {
	Colors,
	EmbedBuilder,
	SlashCommandSubcommandBuilder,
	TextInputStyle,
} from 'discord.js';

export default new SubCommand({
	data: Data(),

	async execute({ interaction, t }) {
		const messageId = interaction.options.getString('message-id');
		const formTitle = interaction.options.getString('form-title');

		const ticketExists = await TicketRepo.existsBy({ messageId });

		if (!ticketExists)
			return interaction.reply({
				content: t('ticket:questions.notFound', { messageId }),
				ephemeral: true,
			});

		const ticket = await TicketRepo.findOne({
			where: { messageId },
			relations: ['questions'],
		});

		ticket.formTitle = formTitle;
		await ticket.save();

		const embed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle(t('ticket:questions.title'))
			.setDescription(t('ticket:questions.description', { messageId }))
			.addFields([{ name: 'Form Title', value: `"${formTitle}"` }]);

		for (let i = 1; i <= 5; i++) {
			const question = interaction.options.getString(`question-${i}`);
			const placeholder = interaction.options.getString(
				`question-${i}-placeholder`,
				false,
			);
			const minMaxLength = interaction.options.getString(
				`question-${i}-min-max-length`,
				false,
			);
			const required =
				interaction.options.getBoolean(`question-${i}-required`, false) ||
				false;

			if (!question) continue;

			let minLength = 0;
			let maxLength = 0;

			if (minMaxLength && minMaxLength.includes('-')) {
				const minMaxSplit = minMaxLength?.split('-');

				const parseMin = parseInt(minMaxSplit[0], 10);
				const parseMax = parseInt(minMaxSplit[1], 10);

				if (!isNaN(parseMin)) minLength = parseMin;
				if (!isNaN(parseMax)) maxLength = parseMax;
			}

			const questionDb = new TicketQuestion();
			questionDb.ticket = ticket;
			questionDb.label = question;
			questionDb.placeholder = placeholder;
			questionDb.required = required;
			questionDb.style = TextInputStyle.Paragraph;

			if (minLength) questionDb.minLength = minLength;
			if (maxLength) questionDb.maxLength = maxLength;

			embed.addFields([
				{
					name: `Question ${i}: "${question}"`,
					value:
						`placeholder: ${placeholder}\n` +
						`minLength: ${minLength}\n` +
						`maxLength: ${maxLength}\n` +
						`required: ${required}`,
					inline: false,
				},
			]);

			await questionDb.save();
		}

		interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
});

function Data() {
	const data = new SlashCommandSubcommandBuilder()
		.setName('questions')
		.setDescription('Set the questions for the ticket system')
		.addStringOption((option) =>
			option
				.setName('message-id')
				.setDescription('Id of the ticket main message')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('form-title')
				.setDescription('Title of the form, above the questions')
				.setMaxLength(45)
				.setRequired(true),
		);

	for (let i = 1; i <= 5; i++) {
		data.addStringOption((option) =>
			option
				.setName(`question-${i}`)
				.setDescription(`Question ${i}`)
				.setMaxLength(45)
				.setRequired(i === 1),
		)
			.addStringOption((option) =>
				option
					.setName(`question-${i}-placeholder`)
					.setDescription(`Placeholder for question ${i}`)
					.setMaxLength(100)
					.setRequired(false),
			)
			.addStringOption((option) =>
				option
					.setName(`question-${i}-min-max-length`)
					.setDescription(`Min and max length, like 5-100`)
					.setMaxLength(9)
					.setRequired(false),
			)
			.addBooleanOption((option) =>
				option
					.setName(`question-${i}-required`)
					.setDescription(`if question ${i} is required`)
					.setRequired(false),
			);
	}

	return data;
}
