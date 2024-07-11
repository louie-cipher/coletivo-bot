import { TicketEntry } from 'db/entities';
import { TicketEntryRepo, TicketRepo } from 'db/repositories';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChannelType,
	Colors,
	EmbedBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
} from 'discord.js';
import { consoleError, consoleLog } from 'utils/log';

export async function TicketCreate(interaction: ButtonInteraction) {
	try {
		const id = parseInt(interaction.customId.slice(14), 10);

		const ticket = await TicketRepo.findOne({
			where: { id },
			relations: ['questions'],
		});

		if (!ticket || !ticket.questions || ticket.questions.length === 0)
			return interaction.reply({
				content: 'Ticket not configured yet',
				ephemeral: true,
			});

		const hasEntry = await TicketEntry.exists({
			where: {
				userId: interaction.user.id,
				ticket: { id },
			},
		});

		if (hasEntry)
			return interaction.reply({
				content: 'Você já tem um ticket aberto!',
				ephemeral: true,
			});

		const questions: TextInputBuilder[] = ticket.questions.map((question, i) => {
			const q = new TextInputBuilder()
				.setCustomId(`question${i}`)
				.setLabel(question.label)
				.setStyle(question.style)
				.setRequired(question.required);

			if (question.placeholder) q.setPlaceholder(question.placeholder);
			if (question.defaultValue) q.setValue(question.defaultValue);
			if (question.minLength) q.setMinLength(question.minLength);
			if (question.maxLength) q.setMaxLength(question.maxLength);
			return q;
		});

		const rows: ActionRowBuilder<TextInputBuilder>[] = [];

		questions.forEach((input) => {
			rows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
		});

		const modal = new ModalBuilder()
			.setTitle(ticket.formTitle)
			.setCustomId(`send_embed_${interaction.id}`)
			.addComponents(...rows);

		await interaction.showModal(modal);

		const modalReply = await interaction.awaitModalSubmit({
			time: 600_000, // 10 minutes
			filter: (int) => int.customId === `send_embed_${interaction.id}`,
		});

		let answers: string[] = [];
		for (const question of questions) {
			answers.push(
				modalReply.fields.getTextInputValue(question.data.custom_id),
			);
		}

		const channel = await interaction.guild.channels.fetch(ticket.modChannel);
		if (!('send' in channel)) return;

		const embed = new EmbedBuilder()
			.setTitle('Nova resposta de ticket')
			.setColor(Colors.Yellow)
			.setTimestamp()
			.setDescription(
				`Ticket de ${interaction.user.toString()}\nID: ${interaction.user.id}`,
			);

		for (let i = 0; i < answers.length; i++) {
			const value = answers[i] ? answers[i] : '`[null]`';
			embed.addFields([{ name: questions[i].data.label, value }]);
		}

		const entry = new TicketEntry();
		entry.userId = interaction.user.id;
		entry.ticket = ticket;

		await entry.save();

		let buttons: ActionRowBuilder<ButtonBuilder> =
			new ActionRowBuilder<ButtonBuilder>();

		if (ticket.approvalChannel || ticket.assignRole)
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId(`ticket-approve-${entry.id}`)
					.setLabel('Aprovar')
					.setStyle(ButtonStyle.Success),
			);

		if (ticket.createChatCategory)
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId(`ticket-chat-${entry.id}`)
					.setLabel('Criar Chat')
					.setStyle(ButtonStyle.Primary),
			);

		buttons.addComponents(
			new ButtonBuilder()
				.setCustomId(`ticket-deny-${entry.id}`)
				.setLabel('Recusar')
				.setStyle(ButtonStyle.Danger),
		);

		await channel.send({
			embeds: [embed],
			components: [buttons],
		});

		await modalReply.reply({
			content: 'Ticket enviado com sucesso!',
			ephemeral: true,
		});
	} catch (err) {
		if (err.name !== 'InteractionCollectorError')
			consoleError('TICKET:CREATE', err);
	}
}

export async function TicketApprove(interaction: ButtonInteraction) {
	try {
		const id = parseInt(interaction.customId.slice(15), 10);

		const entry = await TicketEntry.findOneBy({ id });

		if (!entry) return interaction.reply({ content: 'Ticket not found' });

		const ticket = entry.ticket;
		const member = await interaction.guild.members.fetch(entry.userId);

		if (!member)
			return interaction.reply({
				content: `<@${entry.userId}> (${entry.userId}) not found`,
			});

		if (ticket && ticket.assignRole)
			await member.roles.add(
				entry.ticket.assignRole,
				`approved by: ${interaction.user.id}`,
			);

		const embed = new EmbedBuilder(interaction.message.embeds[0])
			.setColor(Colors.Green)
			.setTimestamp()
			.addFields({
				name: '✅ Aprovado por ✅',
				value: interaction.user.toString(),
			});

		await interaction.message.edit({ embeds: [embed], components: [] });

		await entry.remove();

		if (!ticket.approvalChannel || !ticket.approvalMessage) return;

		const channel = await interaction.guild.channels.fetch(
			ticket.approvalChannel,
		);
		if (!('send' in channel)) return;

		await channel.send({
			content: ticket.approvalMessage.replace(/{user}/g, member.toString()),
		});
	} catch (err) {
		consoleError('TICKET:APPROVE', err);
	}
}

export async function TicketChat(interaction: ButtonInteraction) {
	try {
		const id = parseInt(interaction.customId.slice(12), 10);

		const entry = await TicketEntryRepo.findOneBy({ id });

		if (!entry) return interaction.reply({ content: 'Ticket not found' });

		const member = await interaction.guild.members.fetch(entry.userId);

		if (!member)
			return interaction.reply({
				content: `<@${entry.userId}> (${entry.userId}) not found`,
			});

		const username = member.user.username.replace(/\W/g, '-');

		const channel = await interaction.guild.channels.create({
			name: `ticket-${username}`.slice(0, 100),
			type: ChannelType.GuildText,
			parent: entry.ticket.createChatCategory,
			reason: `ticket chat by admin: ${interaction.user.id}`,
			permissionOverwrites: [
				{
					id: interaction.guild.roles.everyone.id,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: member.id,
					allow: [
						PermissionFlagsBits.ReadMessageHistory,
						PermissionFlagsBits.SendMessages,
						PermissionFlagsBits.ViewChannel,
					],
				},
			],
		});

		interaction.reply({
			content: `Chat criado com sucesso! ${channel.toString()}`,
			ephemeral: true,
		});
	} catch (err) {
		consoleError('TICKET:CHAT', err);
	}
}

export async function TicketDeny(interaction: ButtonInteraction) {
	try {
		const id = parseInt(interaction.customId.slice(12), 10);

		const embed = new EmbedBuilder(interaction.message.embeds[0])
			.setColor(Colors.Red)
			.setTimestamp()
			.addFields({
				name: '❌ Negado por ❌',
				value: interaction.user.toString(),
			});

		const entry = await TicketEntry.findOneBy({ id });

		if (entry) {
			entry.deleted = true;
			await entry.save();
		}

		await interaction.message.edit({ embeds: [embed], components: [] });
	} catch (err) {
		consoleError('TICKET:DENY', err);
	}
}
