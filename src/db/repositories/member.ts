import { MemberModel } from 'db/entities';
import { Repository } from 'typeorm';
import db from '..';
import { User } from 'discord.js';

class MemberRepo extends Repository<MemberModel> {
	constructor() {
		super(MemberModel, db.manager);
	}

	public async findOrCreate(user: User) {
		const memberDB = await this.findOneBy({ id: user.id });

		if (!memberDB) {
			const newMember = new MemberModel();
			newMember.username = user.username;
			newMember.language = 'pt-BR';
			newMember.id = user.id;
			newMember.chatXP = 0;
			newMember.voiceXP = 0;
			newMember.wallet = 0;
			newMember.bank = 0;
			return await this.save(newMember);
		}
		return memberDB;
	}
}

export default new MemberRepo();
