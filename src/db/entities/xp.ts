import {
	Entity,
	Column,
	CreateDateColumn,
	BaseEntity,
	PrimaryGeneratedColumn,
	ManyToOne,
} from 'typeorm';
import { MemberModel } from './member';

@Entity({ name: 'member_xp' })
export class XpModel extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => MemberModel, (member) => member.xp, { onDelete: 'CASCADE' })
	member: MemberModel;

	@Column({ type: 'integer', default: 0 })
	chatXP: number;

	@Column({ type: 'integer', default: 0 })
	voiceXP: number;

	@CreateDateColumn({ type: 'datetime' })
	day: Date;
}
