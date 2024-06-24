import member from './repositories/member';
import guild from './repositories/guild';
import db from '.';
import { Ticket, TicketQuestion, TicketEntry } from './entities';

const TicketRepo = db.manager.getRepository(Ticket);
const TicketQuestionRepo = db.manager.getRepository(TicketQuestion);
const TicketEntryRepo = db.manager.getRepository(TicketEntry);

export {
	member as MemberRepo,
	guild as GuildRepo,
	TicketRepo,
	TicketQuestionRepo,
	TicketEntryRepo,
};
