import member from './repositories/member';
import guild from './repositories/guild';
import xpRepo from './repositories/xp';
import db from '.';
import { Ticket, TicketQuestion, TicketEntry } from './entities';
import { XpModel } from './entities/xp';

const TicketRepo = db.manager.getRepository(Ticket);
const TicketQuestionRepo = db.manager.getRepository(TicketQuestion);
const TicketEntryRepo = db.manager.getRepository(TicketEntry);

export {
	member as MemberRepo,
	guild as GuildRepo,
	xpRepo as XpRepo,
	TicketRepo,
	TicketQuestionRepo,
	TicketEntryRepo,
};
