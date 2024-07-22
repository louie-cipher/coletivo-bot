import SlashCommand from 'classes/SlashCommand';
import { MemberModel } from 'db/entities';
import { MemberRepo } from 'db/repositories';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	Colors,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { TFunction } from 'i18next';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('rank')
		.setDescription('display server rank')
		.setDescriptionLocalizations({
			'pt-BR': 'Mostra o rank do servidor',
		})
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('Rank type')
				.setDescriptionLocalizations({
					'pt-BR': 'Tipo de rank',
				})
				.addChoices([
					{ name: 'Chat XP', value: 'chatXP' },
					{ name: 'Voice XP', value: 'voiceXP' },
				])
				.setRequired(true),
		),
	async execute({ client, interaction, t }) {
		const type = interaction.options.getString('type') as 'chatXP' | 'voiceXP';

		const rankList = await MemberRepo.find({
			order: {
				[type]: 'DESC',
			},
		});

		let pageNumber = 1;

		const message = await interaction.reply(
			await RankPage({ client, rankList, type, pageNumber, t }),
		);

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collector.on('collect', async (buttonInteraction) => {
			const id = buttonInteraction.customId;

			if (id === 'rank-previous') pageNumber--;
			if (id === 'rank-next') pageNumber++;

			await message.edit(
				await RankPage({ client, rankList, type, pageNumber, t }),
			);
		});
	},
});
interface RankPageArgs {
	client: Client;
	rankList: MemberModel[];
	type: 'chatXP' | 'voiceXP';
	pageNumber: number;
	t: TFunction;
}
async function RankPage({ client, rankList, type, pageNumber, t }: RankPageArgs) {
	const embed = new EmbedBuilder()
		.setColor(Colors.Aqua)
		.setTitle(t(`rank.title.${type}`))
		.setDescription(t(`rank.pageNumber`, { pageNumber }));

	const startIndex = (pageNumber - 1) * 10;
	const endIndex = pageNumber * 10;
	const membersPage = rankList.slice(startIndex, endIndex);

	const hasNextPage = endIndex < rankList.length;

	const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId('rank-previous')
			.setEmoji('⬅')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(pageNumber === 1),
		new ButtonBuilder()
			.setCustomId('rank-next')
			.setEmoji('➡')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(!hasNextPage),
	);

	membersPage.forEach(async (member, index) => {
		let username = member.username;
		try {
			const usernameNew = (await client.users.fetch(member.id)).username;
			if (usernameNew !== username) {
				member.username = usernameNew;
				await member.save();
				username = usernameNew;
			}
		} catch (err) {}

		const rankNum = startIndex + index + 1;

		embed.addFields({
			name: `${rankNum}. ${username}`,
			value: `${member[type]}`,
			inline: false,
		});
	});

	return { embeds: [embed], components: [buttons] };
}
