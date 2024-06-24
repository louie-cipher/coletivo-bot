import {
	ChatInputCommandInteraction,
	Client,
	SlashCommandSubcommandBuilder,
} from 'discord.js';
import { GuildModel, MemberModel } from 'db/entities';
import { TFunction } from 'i18next';

interface executeOptions {
	client: Client;
	interaction: ChatInputCommandInteraction;
	memberModel: MemberModel;
	guildModel: GuildModel;
	t: TFunction;
}

type executeFunction = (options: executeOptions) => any;

export type SubCommandType = {
	data: SlashCommandSubcommandBuilder;
	execute: executeFunction;
};
