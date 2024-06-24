import { TextInputStyle } from 'discord.js';
import {
	Entity,
	Column,
	BaseEntity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	Relation,
	OneToMany,
	ManyToOne,
	JoinColumn,
} from 'typeorm';

@Entity({ name: 'ticket' })
export class Ticket extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 32 })
	messageId: string;

	@Column({ type: 'varchar', length: 45, default: 'Ticket' })
	formTitle: string;

	@Column({ type: 'varchar', length: 32 })
	modChannel: string;

	@Column({ type: 'varchar', length: 32, nullable: true })
	createChatCategory: string;

	@Column({ type: 'varchar', length: 32, nullable: true })
	assignRole: string;

	@Column({ type: 'varchar', length: 32, nullable: true })
	approvalChannel: string;

	@Column({ type: 'varchar', length: 1000, nullable: true })
	approvalMessage: string;

	@OneToMany(() => TicketQuestion, (question) => question.ticket, {
		onDelete: 'CASCADE',
	})
	questions: Relation<TicketQuestion[]>;

	@OneToMany(() => TicketEntry, (entry) => entry.ticket, {
		onDelete: 'CASCADE',
	})
	entries: Relation<TicketEntry[]>;
}

@Entity({ name: 'ticket_entry' })
export class TicketEntry extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 32 })
	userId: string;

	@CreateDateColumn({ type: 'datetime' })
	createdAt: Date;

	@Column({ type: 'boolean', default: false })
	deleted: boolean;

	@ManyToOne(() => Ticket, (ticket) => ticket.id, { eager: true })
	@JoinColumn({ name: 'ticketId' })
	ticket: Relation<Ticket>;
}

@Entity({ name: 'ticket_question' })
export class TicketQuestion extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 45 })
	label: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	placeholder: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	defaultValue: string;

	@Column({ type: 'boolean', default: false })
	required: boolean;

	@Column({ type: 'int2', default: 0 })
	minLength: number;

	@Column({ type: 'int2', nullable: true })
	maxLength: number;

	@Column({ type: 'int2', default: TextInputStyle.Paragraph })
	style: TextInputStyle;

	@ManyToOne(() => Ticket, (ticket) => ticket.id, { eager: true })
	@JoinColumn({ name: 'ticketId' })
	ticket: Relation<Ticket>;
}
