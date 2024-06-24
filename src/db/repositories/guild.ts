import { GuildModel } from 'db/entities';
import { Repository } from 'typeorm';
import db from '..';

class GuildRepo extends Repository<GuildModel> {
	constructor() {
		super(GuildModel, db.manager);
	}

	public async findOrCreate() {
		const guildDB = await this.findOneBy({ id: 1 });

		if (!guildDB) {
			const newGuild = new GuildModel();
			return await this.save(newGuild);
		}
		return guildDB;
	}
}

export default new GuildRepo();
