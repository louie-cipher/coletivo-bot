import client from 'client';
import { GuildRepo } from 'db/repositories';
import { Colors, EmbedBuilder, Events } from 'discord.js';

client.on(Events.GuildMemberAdd, async (member) => {
	const guildModel = await GuildRepo.findOrCreate();
	if (!guildModel.welcomeChannel) return;

	const guild = member.guild;

	const channel = guild.channels.cache.get(guildModel.welcomeChannel);
	if (!channel || !('send' in channel)) return;

	const embed = new EmbedBuilder()
		.setTitle('👋 Boas-vindas!')
		.setColor(member.user.accentColor || Colors.Aqua)
		.setDescription(
			`Oie, ${member.user.username}!\n` +
				'Boas-vindas ao nosso servidor!  🎉\n' +
				`Leia as regras em ${guild.rulesChannel.toString()}\n` +
				'e apresente-se em <#1248663199205822525>',
		)
		.setFooter({
			text: `Já somos ${guild.memberCount} membros!`,
			iconURL: member.user.displayAvatarURL(),
		});

	channel.send({ embeds: [embed], content: member.toString() });
});
