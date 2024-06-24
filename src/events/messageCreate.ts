import GlobalVars from 'classes/globalVars';
import client from 'client';
import { MemberModel } from 'db/entities';
import { MemberRepo } from 'db/repositories';
import { EmbedBuilder, Events, Message } from 'discord.js';
import { consoleError } from 'utils/log';

client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot || !message.inGuild() || !message.guild.available) return;

	const memberModel = await MemberRepo.findOrCreate(message.author);

	dice(message);
	chatXp(memberModel, message.content.length);
});

async function chatXp(memberModel: MemberModel, messageLength: number) {
	try {
		const lastMsg = memberModel.lastMessage
			? memberModel.lastMessage.getTime()
			: 0;

		if (Date.now() - lastMsg < GlobalVars.chatXPCooldown * 1000) return;

		const xpBoost = messageLength > 200 ? 3 : 1;
		memberModel.chatXP += GlobalVars.chatXP * xpBoost;
		memberModel.lastMessage = new Date();
		await memberModel.save();
	} catch (err) {}
}

async function dice(message: Message) {
	try {
		let quantity = 1;
		let faces = 0;
		let sum = 0;

		if (message.content.toLowerCase().at(0) === 'd') {
			faces = parseInt(message.content.substring(1), 10);
			if (isNaN(faces) || faces < 2) return;
		} else if (message.content.toLowerCase().at(1) === 'd') {
			quantity = parseInt(message.content.at(0), 10);
			if (isNaN(quantity) || quantity < 1) return;

			faces = parseInt(message.content.substring(2), 10);
			if (isNaN(faces) || faces < 2) return;
		} else return;

		if (message.content.includes('+')) {
			const plus = parseInt(message.content.split('+')[1], 10);
			if (isNaN(plus)) return;
			sum = plus;
		}

		let embed = new EmbedBuilder();

		if (quantity > 1) {
			let total = sum;
			let description = '';

			for (let i = 0; i < quantity; i++) {
				const dado = Math.ceil(Math.random() * faces);
				description += `dado #${i + 1}: **${dado}**\n`;
				total += dado;
			}

			if (sum > 0) description += `soma: **${sum}**`;
			embed.setTitle(`🎲 ${total}`);
			embed.setDescription(description);
		} else {
			let total = sum + Math.ceil(Math.random() * faces);
			embed.setTitle(`🎲 ${total}`);
			if (sum > 0)
				embed.setDescription(`dado: **${total - sum}**\nsoma: **${sum}**`);
		}

		message.reply({
			embeds: [embed],
		});
	} catch (err) {
		consoleError('MESSAGE:DICE', err);
	}
}
