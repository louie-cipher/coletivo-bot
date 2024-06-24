import { DataSource } from 'typeorm';
import { consoleError, consoleLog } from 'utils/log';
import {
	GuildModel,
	MemberModel,
	Ticket,
	TicketEntry,
	TicketQuestion,
} from './entities';

const db = new DataSource({
	type: 'sqlite',
	database: `${process.env.GUILD_ID}.sqlite`,
	synchronize: true,
	entities: [GuildModel, MemberModel, Ticket, TicketEntry, TicketQuestion],
});

export default db;

export const initDB = async () =>
	await db
		.initialize()
		.then(async () => consoleLog('DATABASE', 'Connected to database'))
		.catch((err) => consoleError('DATABASE', err));
