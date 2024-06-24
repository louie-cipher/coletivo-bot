import client from 'client';
import { GuildRepo, MemberRepo } from 'db/repositories';
import { ButtonInteraction, ChatInputCommandInteraction, Events } from 'discord.js';
import i18next from 'i18n';
import { commands } from 'utils/loader';
import { TicketCreate, TicketApprove, TicketChat, TicketDeny } from './ticket';

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) commandInteraction(interaction);
	if (interaction.isButton()) buttonInteraction(interaction);
});

async function commandInteraction(interaction: ChatInputCommandInteraction) {
	if (!interaction.inGuild()) return;

	const command = commands.get(interaction.commandName);
	if (!command)
		return interaction.reply({
			content: 'Command not found',
			ephemeral: true,
		});

	const memberModel = await MemberRepo.findOrCreate(interaction.user);
	const guildModel = await GuildRepo.findOrCreate();

	const lang = memberModel.language || guildModel.language;
	const t = i18next.getFixedT(lang);

	command.execute({
		client,
		interaction,
		memberModel,
		guildModel,
		t,
	});
}

async function buttonInteraction(interaction: ButtonInteraction) {
	const customId = interaction.customId;
	if (customId.startsWith('ticket-')) handleTicket(interaction);
}

async function handleTicket(interaction: ButtonInteraction) {
	const commandName = interaction.customId.split('-')[1];

	switch (commandName) {
		case 'create':
			return TicketCreate(interaction);
		case 'approve':
			return TicketApprove(interaction);
		case 'chat':
			return TicketChat(interaction);
		case 'deny':
			return TicketDeny(interaction);
	}
}
