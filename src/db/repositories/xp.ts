import { Repository } from 'typeorm';
import db from '..';
import { User } from 'discord.js';
import { XpModel } from 'db/entities/xp';

class XpRepo extends Repository<XpModel> {
	constructor() {
		super(XpModel, db.manager);
	}

	public async findOrCreateToday(user: User) {
		const today = new Date(new Date().setHours(0, 0, 0, 0));
		let xpRecord = await this.findOneBy({
			memberId: user.id,
			day: today,
		});

		if (!xpRecord) {
			xpRecord = new XpModel();
			xpRecord.memberId = user.id;
			xpRecord.chatXP = 0;
			xpRecord.voiceXP = 0;
			xpRecord.day = today;
			await this.save(xpRecord);
		}

		return xpRecord;
	}
}

export default new XpRepo();
