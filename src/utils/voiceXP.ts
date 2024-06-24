import { BaseGuildVoiceChannel, Collection, Guild, GuildMember } from 'discord.js';
import { consoleError, consoleLog } from './log';
import { MemberRepo } from 'db/repositories';

export default async function (guild: Guild) {
	if (process.env.NODE_ENV === 'debug')
		consoleLog('VOICE_XP', 'updating voice XP');
	try {
		const channels = guild.channels.cache.filter(
			(ch) => ch.isVoiceBased() && validMembers(ch).size > 1,
		);

		for (const channel of channels.values()) {
			const members = validMembers(channel as BaseGuildVoiceChannel);
			if (!members || members.size < 2) continue;

			for (const member of members.values()) {
				const memberDB = await MemberRepo.findOrCreate(member.user);
				memberDB.voiceXP += 1;

				await MemberRepo.save(memberDB);
			}
		}
	} catch (err) {
		consoleError('VOICE_XP', err);
	}
}

const validMembers = (channel: BaseGuildVoiceChannel) =>
	channel.members && channel.members.size > 0
		? channel.members.filter(
				(mb) => !mb.user.bot && !mb.voice.mute && !mb.voice.deaf,
			)
		: new Collection<string, GuildMember>();
