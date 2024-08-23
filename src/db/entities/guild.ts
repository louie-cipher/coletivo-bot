import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity({ name: 'guild' })
export class GuildModel extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 6, default: 'pt-BR' })
	language: string;

	@Column({ type: 'varchar', length: 32, nullable: true })
	welcomeChannel: string;

	@Column({ type: 'varchar', length: 4000, nullable: true })
	welcomeMessage: string;

	@Column({ type: 'varchar', length: 32, nullable: true })
	logChannel: string;

	@Column({ type: 'varchar', length: 100, default: '<:invisible:1275212139421892608>' })
	invisibleEmoji: string;

	@Column({ type: 'integer', default: 1 })
	voiceXP: number;

	@Column({ type: 'integer', default: 300 }) // in seconds (5 minutes)
	voiceXPInterval: number;

	@Column({ type: 'integer', default: 1 })
	chatXP: number;

	@Column({ type: 'integer', default: 50 })
	dailyCoins: number;

	@Column({ type: 'integer', default: 10 }) // in seconds
	chatXPInterval: number;

	@Column({ type: 'varchar', length: 100, default: ':coin:' })
	coinEmoji: string;

	@Column({ type: 'varchar', length: 32, default: 'coins' })
	coinName: string;
}
