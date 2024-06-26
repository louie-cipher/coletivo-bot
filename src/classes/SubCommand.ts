import { SubCommandExecuteArgs, SubCommandType } from 'types/SubCommand';
import { consoleError } from 'utils/log';

export class SubCommand {
	constructor(commandOptions: SubCommandType) {
		Object.assign(this, commandOptions);
		const execute = commandOptions.execute;
		commandOptions.execute = async (options: SubCommandExecuteArgs) => {
			try {
				await execute(options);
			} catch (err) {
				consoleError(`CMD:${commandOptions.data.name.toUpperCase()}`, err);
			}
		};
	}
}
