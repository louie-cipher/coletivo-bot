import {
	Entity,
	Column,
	PrimaryColumn,
	CreateDateColumn,
	UpdateDateColumn,
	BaseEntity,
} from 'typeorm';

@Entity({ name: 'member' })
export class MemberModel extends BaseEntity {
	@PrimaryColumn({ type: 'varchar', length: 32 })
	id: string;

	@Column({ type: 'varchar', length: 100 })
	username: string;

	@Column({ type: 'varchar', length: 6 })
	language: string;

	@Column({ type: 'integer', default: 0 })
	chatXP: number;

	@Column({ type: 'integer', default: 0 })
	voiceXP: number;

	@Column({ type: 'integer', default: 0 })
	wallet: number;

	@Column({ type: 'integer', default: 0 })
	bank: number;

	@Column({ type: 'boolean', default: false })
	doNotDisturb: boolean;

	@Column({ type: 'datetime', nullable: true })
	lastMessage: Date;

	@Column({ type: 'datetime', nullable: true })
	lastCommand: Date;

	@Column({ type: 'datetime', nullable: true })
	lastRob: Date;

	@Column({ type: 'datetime', nullable: true })
	lastDaily: Date;

	@Column({ type: 'integer', default: 0 })
	dailyCombo: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@Column({ type: 'datetime', nullable: true })
	leftAt: Date;
}
