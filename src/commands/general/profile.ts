import { SlashCommandBuilder } from '@discordjs/builders';
import { MemberRepo } from 'db/repositories';
import GlobalVars from 'classes/globalVars';
import SlashCommand from 'classes/SlashCommand';
import { Colors } from 'discord.js';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('perfil')
		.setDescription('Mostra o perfil de um usuário')
		.addUserOption((option) =>
			option
				.setName('usuário')
				.setDescription('O usuário que você deseja ver o perfil')
				.setRequired(false),
		),
	execute: async ({ interaction, memberModel }) => {
		await interaction.deferReply({ ephemeral: false });

		const targetUser =
			interaction.options.getUser('usuário') || interaction.user;

		const targetMember = interaction.guild.members.cache.get(targetUser.id);

		if (!targetMember)
			return interaction.editReply({
				content: `🤷‍♀️ | ${targetUser.tag} não encontrado no servidor`,
			});

		const targetMemberDB =
			targetUser.id === interaction.user.id
				? memberModel
				: await MemberRepo.findOneBy({ id: targetUser.id });

		if (!targetMemberDB)
			return interaction.editReply({
				content: `🤷‍♀️ | ${targetUser.tag} ainda não possui perfil no bot`,
			});

		interaction.editReply({
			embeds: [
				{
					color: Colors.Aqua,
					title: `Perfil de ${targetUser.tag}`,
					thumbnail: {
						url: targetUser.displayAvatarURL({ forceStatic: false }),
					},
					fields: [
						{
							name: '💬 Chat XP',
							value: `${targetMemberDB.chatXP}`,
							inline: true,
						},
						{
							name: '🔊 Call XP',
							value: `${targetMemberDB.voiceXP}`,
							inline: true,
						},
						{
							name: 'Total XP',
							value: `${targetMemberDB.chatXP + targetMemberDB.voiceXP}`,
							inline: true,
						},
						{
							name: `${GlobalVars.coinEmoji} Carteira`,
							value: `${targetMemberDB.wallet}`,
							inline: true,
						},
						{
							name: `${GlobalVars.coinEmoji} Banco`,
							value: `${targetMemberDB.bank}`,
							inline: true,
						},
						{
							name: `${GlobalVars.coinEmoji} Total de ${GlobalVars.coinName}`,
							value: `${targetMemberDB.wallet + targetMemberDB.bank}`,
							inline: true,
						},
					],
				},
			],
		});
	},
});
