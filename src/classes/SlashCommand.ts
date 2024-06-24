import {
	CacheType,
	ChatInputCommandInteraction,
	Client,
	CommandInteraction,
	PermissionResolvable,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { GuildModel, MemberModel } from 'db/entities';
import { consoleError } from 'utils/log';
import { TFunction } from 'i18next';

export interface SlashCommandExecuteArgs {
	client: Client;
	interaction: ChatInputCommandInteraction;
	memberModel: MemberModel;
	guildModel: GuildModel;
	t: TFunction;
}

type SlashCommandExecute = (options: SlashCommandExecuteArgs) => any;

export type SlashCommandType = {
	data:
		| SlashCommandBuilder
		| Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
		| SlashCommandSubcommandsOnlyBuilder
		| SlashCommandOptionsOnlyBuilder;
	permissions?: PermissionResolvable[];
	execute: SlashCommandExecute;
};

export default class SlashCommand {
	constructor(commandOptions: SlashCommandType) {
		Object.assign(this, commandOptions);
		const execute = commandOptions.execute;
		commandOptions.execute = async (options: SlashCommandExecuteArgs) => {
			try {
				await execute(options);
			} catch (err) {
				consoleError(`CMD:${commandOptions.data.name.toUpperCase()}`, err);
			}
		};
	}
}
