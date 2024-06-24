import {
	Collection,
	CommandInteraction,
	Message,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	User,
	SlashCommandBuilder,
	Colors,
} from 'discord.js';
import SlashCommand from 'classes/SlashCommand';
import GlobalVars from 'classes/globalVars';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('jogo-da-memoria')
		.setDescription('o clássico jogo de achar os pares')
		.addUserOption((option) =>
			option
				.setName('player2')
				.setDescription('o usuário que você quer desafiar')
				.setRequired(false),
		),
	execute: async ({ interaction }) => {
		await interaction.deferReply({ ephemeral: false });
		const player2 = interaction.options.getUser('player2');

		if (player2) multiPlayer(interaction, player2);
		else singlePlayer(interaction);
	},
});
const ramEmoji = '💾';
const emojis = [
	'🧁',
	'🍕',
	'🍔',
	'💻',
	'🎮',
	'🌈',
	'💾',
	'🎧',
	'🏆',
	'🎁',
	'🎨',
	'🚀',
	'🎲',
	'🍫',
	'❄',
	'🎹',
	'📺',
	'📸',
	'📚',
	'⭐',
	'⛄',
	'🎷',
];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function multiPlayer(
	interaction: CommandInteraction,
	player2: User,
): Promise<any> {
	await interaction.deleteReply();

	const player1 = interaction.user;

	let { board, rows } = initGame();

	const startEmbed = new EmbedBuilder()
		.setColor(Colors.Aqua)
		.setTitle(`${ramEmoji} Jogo da Memória ${ramEmoji}`)
		.setFields([
			{
				name: 'Como jogar',
				value:
					'Você precisa encontrar os pares de botões que possuem o mesmo emoji.\n' +
					'Para isso, clique em dois botões para ver se são iguais\n' +
					'O objetivo é encontrar mais pares que o outro jogador',
			},
			{ name: 'Vez de', value: player1.toString() },
		]);

	const message = await interaction.channel.send({
		content: `${player1.toString()} vs ${player2.toString()}`,
		embeds: [startEmbed],
		components: rows,
	});

	await sleep(1000);
	const blank = blankBoard();
	await message.edit({
		components: blank,
	});

	const collector = message.createMessageComponentCollector({
		filter: (int) =>
			int.isButton() &&
			(int.user.id === player1.id || int.user.id === player2.id),
		idle: 5 * 60_000, // 5 min
	});

	let p1DiscoveredEmojis = new Collection<number, string>();
	let p2DiscoveredEmojis = new Collection<number, string>();

	let round = 0;
	let roundPlayer = player1;
	let roundChoices = new Collection<number, string>();

	collector.on('collect', async (buttonInt): Promise<any> => {
		if (!buttonInt.isButton()) return;
		buttonInt
			.deferReply({ ephemeral: false })
			.then(() => buttonInt.deleteReply().catch(() => {}));
		if (buttonInt.user.id !== roundPlayer.id) return;

		const choiceNum = parseInt(buttonInt.customId);

		roundChoices.set(choiceNum, board.get(choiceNum));

		if (roundChoices.size < 2)
			return message.edit({
				components: multiPlayerBoard(
					board,
					p1DiscoveredEmojis,
					p2DiscoveredEmojis,
					roundChoices,
				),
			});

		const choice1 = roundChoices.first();
		const choice2 = roundChoices.last();
		round++;
		const areChoicesEqual = choice1 === choice2;

		if (areChoicesEqual === true) {
			const playerEmojis =
				roundPlayer.id === player1.id
					? p1DiscoveredEmojis
					: p2DiscoveredEmojis;
			roundChoices.map((emoji, number) => playerEmojis.set(number, emoji));
		}

		message.edit({
			components: multiPlayerBoard(
				board,
				p1DiscoveredEmojis,
				p2DiscoveredEmojis,
				roundChoices,
			),
		});

		roundChoices.clear();
		if (areChoicesEqual === false) await sleep(1500);

		let embed = new EmbedBuilder(startEmbed.data).setFields([
			{
				name: `Pares encontrados de ${player1.username}`,
				value: `${p1DiscoveredEmojis.size / 2}`,
			},
			{
				name: `Pares encontrados de ${player2.username}`,
				value: `${p2DiscoveredEmojis.size / 2}`,
			},
			{ name: 'Rodada', value: `#${round}` },
			{ name: 'Vez de', value: roundPlayer.toString() },
		]);

		message.edit({
			content: `${player1.toString()} vs ${player2.toString()}`,
			embeds: [embed],
			components: multiPlayerBoard(
				board,
				p1DiscoveredEmojis,
				p2DiscoveredEmojis,
				roundChoices,
			),
		});

		if (p1DiscoveredEmojis.size + p2DiscoveredEmojis.size !== board.size) {
			roundPlayer = roundPlayer === player1 ? player2 : player1;
			return message
				.edit({
					content: `${player1.toString()} vs ${player2.toString()}`,
					components: multiPlayerBoard(
						board,
						p1DiscoveredEmojis,
						p2DiscoveredEmojis,
						roundChoices,
					),
				})
				.catch(() => {});
		}

		if (p1DiscoveredEmojis.size === p2DiscoveredEmojis.size) {
			// Empate

			const embed = new EmbedBuilder(startEmbed.data)
				.setColor(Colors.Yellow)
				.setDescription(
					`**Empate!**\n\n${player1.toString()} e ${player2.toString()} tiveram a mesma pontuação!`,
				);

			return message
				.edit({
					content: `${player1.toString()} vs ${player2.toString()}`,
					embeds: [embed],
				})
				.catch(() => {});
		}

		const winner =
			p1DiscoveredEmojis.size > p2DiscoveredEmojis.size ? player1 : player2;

		const winEmbed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle(`${ramEmoji} 🎉 Jogo da Memória 🎉 ${ramEmoji}`)
			.setDescription(`${winner.toString()} venceu o jogo!`)
			.setFields([
				{
					name: `Pares encontrados de ${player1.username}`,
					value: `${p1DiscoveredEmojis.size / 2}`,
				},
				{
					name: `Pares encontrados de ${player2.username}`,
					value: `${p2DiscoveredEmojis.size / 2}`,
				},
			]);

		await message.edit({
			content: `${player1.toString()} vs ${player2.toString()}`,
			embeds: [winEmbed],
		});

		collector.stop();
	});
}

async function singlePlayer(interaction: CommandInteraction): Promise<any> {
	let { board, rows } = initGame();

	let discoveredEmojis = new Collection<number, string>();

	const startEmbed = new EmbedBuilder()
		.setColor(Colors.Aqua)
		.setTitle(`${ramEmoji} Jogo da Memória ${ramEmoji}`)
		.addFields([
			{
				name: 'Como jogar',
				value:
					'Você precisa encontrar os pares de botões que possuem o mesmo emoji.\n' +
					'Para isso, clique em dois botões para ver se são iguais\n' +
					'O objetivo é encontrar todos os pares no menor número de rodadas possíveis',
			},
		]);

	const message = (await interaction.editReply({
		embeds: [startEmbed],
		components: rows,
	})) as Message;

	await sleep(1500);
	const blank = blankBoard();
	await message.edit({
		components: blank,
	});

	const collector = message.createMessageComponentCollector({
		filter: (int) => int.user.id === interaction.user.id && int.isButton(),
		idle: 5 * 60_000, // 5 min
	});

	let round = 0;
	let roundChoices = new Collection<number, string>();

	collector.on('collect', async (buttonInt): Promise<any> => {
		if (!buttonInt.isButton()) return;

		buttonInt
			.deferReply({ ephemeral: false })
			.then(() => buttonInt.deleteReply().catch(() => {}));

		const choiceNum = parseInt(buttonInt.customId);
		roundChoices.set(choiceNum, board.get(choiceNum));

		// First choice - wait for second choice
		if (roundChoices.size < 2)
			return interaction.editReply({
				components: singlePlayerBoard(board, discoveredEmojis, roundChoices),
			});

		const choice1 = roundChoices.first();
		const choice2 = roundChoices.last();
		round++;
		const areChoicesEqual = choice1 === choice2;

		if (areChoicesEqual)
			roundChoices.map((emoji, number) => discoveredEmojis.set(number, emoji));

		const embed = new EmbedBuilder(startEmbed.data).setFields([
			{
				name: 'Pares encontrados',
				value: `${discoveredEmojis.size / 2} de ${board.size / 2}`,
			},
			{ name: 'Rodada', value: `#${round}` },
		]);

		interaction.editReply({
			embeds: [embed],
			components: singlePlayerBoard(board, discoveredEmojis, roundChoices),
		});

		roundChoices.clear();
		if (areChoicesEqual === false) await sleep(1500);

		if (discoveredEmojis.size !== board.size)
			return interaction
				.editReply({
					components: singlePlayerBoard(
						board,
						discoveredEmojis,
						roundChoices,
					),
				})
				.catch(() => {});

		const winEmbed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle(`${ramEmoji} 🎉 Jogo da Memória 🎉 ${ramEmoji}`)
			.setDescription(
				'Você achou todos os pares!\n\n' +
					`Você conseguiu em **${round}** rounds`,
			);

		collector.stop();

		return interaction
			.editReply({
				embeds: [winEmbed],
			})
			.catch(() => {});
	}); // Button collector end
}

function initGame(): {
	rows: ActionRowBuilder<ButtonBuilder>[];
	board: Collection<number, string>;
} {
	let rows: ActionRowBuilder<ButtonBuilder>[] = [];
	let board = new Collection<number, string>();

	let remainingEmojis: string[] = [];
	while (remainingEmojis.length !== 24) {
		let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
		while (remainingEmojis.includes(randomEmoji))
			randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
		remainingEmojis.push(randomEmoji);
		remainingEmojis.push(randomEmoji);
	}

	let i = 1;

	for (let linha = 0; linha < 5; linha++) {
		let row = new ActionRowBuilder<ButtonBuilder>();

		for (let col = 0; col < 5; col++) {
			if (i === 13) {
				row.addComponents(
					new ButtonBuilder()
						.setEmoji(GlobalVars.invisibleEmoji)
						.setCustomId(i.toString())
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true),
				);
			} else {
				const rand = Math.floor(Math.random() * remainingEmojis.length);
				const emoji = remainingEmojis[rand];
				remainingEmojis.splice(rand, 1);

				board.set(i, emoji);

				row.addComponents(
					new ButtonBuilder()
						.setEmoji(emoji)
						.setCustomId(i.toString())
						.setStyle(ButtonStyle.Secondary),
				);
			}
			i++;
		}
		rows.push(row);
	}

	return {
		rows: rows,
		board: board,
	};
}

function blankBoard() {
	let rows: ActionRowBuilder<ButtonBuilder>[] = [];
	let i = 1;
	for (let linha = 0; linha < 5; linha++) {
		let row = new ActionRowBuilder<ButtonBuilder>();

		for (let col = 0; col < 5; col++) {
			row.addComponents(
				new ButtonBuilder()
					.setEmoji(GlobalVars.invisibleEmoji)
					.setCustomId(i.toString())
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(i === 13),
			);
			i++;
		}
		rows.push(row);
	}
	return rows;
}

function singlePlayerBoard(
	board: Collection<number, string>,
	discoveredEmojis: Collection<number, string>,
	roundChoices: Collection<number, string>,
) {
	let rows: ActionRowBuilder<ButtonBuilder>[] = [];
	let i = 1;
	for (let linha = 0; linha < 5; linha++) {
		let row = new ActionRowBuilder<ButtonBuilder>();

		for (let col = 0; col < 5; col++) {
			const emoji =
				roundChoices.has(i) || discoveredEmojis.has(i)
					? board.get(i)
					: GlobalVars.invisibleEmoji;
			const disabled =
				roundChoices.has(i) || discoveredEmojis.has(i) || i === 13;
			const style = discoveredEmojis.has(i)
				? ButtonStyle.Success
				: ButtonStyle.Secondary;

			row.addComponents(
				new ButtonBuilder()
					.setCustomId(i.toString())
					.setDisabled(disabled)
					.setEmoji(emoji)
					.setStyle(style),
			);
			i++;
		}
		rows.push(row);
	}
	return rows;
}

function multiPlayerBoard(
	board: Collection<number, string>,
	p1Emojis: Collection<number, string>,
	p2Emojis: Collection<number, string>,
	roundChoices: Collection<number, string>,
) {
	let rows: ActionRowBuilder<ButtonBuilder>[] = [];
	let i = 1;
	for (let linha = 0; linha < 5; linha++) {
		let row = new ActionRowBuilder<ButtonBuilder>();

		for (let col = 0; col < 5; col++) {
			const emoji =
				roundChoices.has(i) || p1Emojis.has(i) || p2Emojis.has(i)
					? board.get(i)
					: GlobalVars.invisibleEmoji;
			const disabled =
				i === 13 ||
				roundChoices.has(i) ||
				p1Emojis.has(i) ||
				p2Emojis.has(i);

			let style = ButtonStyle.Secondary;
			if (p1Emojis.has(i)) style = ButtonStyle.Success;
			else if (p2Emojis.has(i)) style = ButtonStyle.Primary;

			row.addComponents(
				new ButtonBuilder()
					.setCustomId(i.toString())
					.setDisabled(disabled)
					.setEmoji(emoji)
					.setStyle(style),
			);
			i++;
		}
		rows.push(row);
	}
	return rows;
}
