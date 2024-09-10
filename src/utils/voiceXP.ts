import { Collection, Guild, GuildMember } from 'discord.js';
import { consoleError, consoleLog } from './log';
import { MemberRepo } from 'db/repositories';

export default async function (guild: Guild) {
	if (process.env.NODE_ENV === 'debug')
		consoleLog('VOICE_XP', 'updating voice XP');
	try {
		const channels = guild.channels.cache.filter(
			(ch) =>
				ch.isVoiceBased() &&
				ch.members.some((mb) => !mb.user.bot) &&
				ch.id !== guild.afkChannelId,
		);

		for (const channel of channels.values()) {
			const members = listeningMembers(
				channel.members as Collection<string, GuildMember>,
			);

			for (const member of members.values()) {
				const memberDB = await MemberRepo.findOrCreate(member.user);

				if (memberDB.voiceXP < 800) memberDB.voiceXP++;
				if (!member.voice.mute && members.size > 1) memberDB.voiceXP++;

				await MemberRepo.save(memberDB);
			}
		}
	} catch (err) {
		consoleError('VOICE_XP', err);
	}
}

const listeningMembers = (members: Collection<string, GuildMember>) =>
	members.filter((mb) => !mb.user.bot && !mb.voice.deaf);
