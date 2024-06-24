import {
	APIInteraction,
	ChatInputCommandInteraction,
	Client,
	GuildMember,
} from 'discord.js';

export class FixedInteraction extends ChatInputCommandInteraction {
	constructor(client: Client<true>, data: APIInteraction) {
		super(client, data);
	}

	member: GuildMember = this.guild?.members.cache.get(this.user.id);
}
