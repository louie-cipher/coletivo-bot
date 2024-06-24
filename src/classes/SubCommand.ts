import { SubCommandType } from 'types/SubCommand';

export class SubCommand {
	constructor(commandOptions: SubCommandType) {
		Object.assign(this, commandOptions);
	}
}
