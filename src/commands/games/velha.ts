import { SlashCommandBuilder } from '@discordjs/builders';
import {
	ButtonInteraction,
	Collection,
	CommandInteraction,
	Message,
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
	User,
	Colors,
	ButtonStyle,
} from 'discord.js';
import { MemberModel } from 'db/entities';
import { MemberRepo } from 'db/repositories';
import GlobalVars from 'classes/globalVars';
import SlashCommand from 'classes/SlashCommand';
import { TFunction } from 'i18next';

const usersCooldown = new Collection<string, number>();

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('velha')
		.setDescription('joga uma partida de jogo da velha')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('usuário para desafiar')
				.setRequired(false),
		)
		.addIntegerOption((option) =>
			option
				.setName('bet')
				.setDescription(`valor da aposta em ${GlobalVars.coinName}`)
				.setMinValue(1)
				.setRequired(false),
		),
	execute: async ({ interaction, memberModel }) => {
		await interaction.deferReply({ ephemeral: false, fetchReply: true });

		const player2 = interaction.options.getUser('user', false);
		const betValue = interaction.options.getInteger('bet', false) || 0;

		if (usersCooldown.has(interaction.user.id) && betValue > 0) {
			const time = Math.floor(
				(usersCooldown.get(interaction.user.id) - Date.now()) / 1000,
			);
			return interaction.editReply({
				embeds: [
					{
						color: Colors.Red,
						title: '❎ ⭕ | Você está em cooldown',
						description:
							`Você já usou esse comando recentemente, tente novamente em **${time} segundos**.\n` +
							`Caso você já tenha outra mensagem em jogo, continue jogando nessa mensagem.`,
					},
				],
			});
		}

		if (!player2) singlePlayer(interaction, memberModel, betValue);
		else multiPlayer(interaction, player2, memberModel, betValue);
	},
});

async function game(
	interaction: CommandInteraction,
	betValue: number,
	memberModel: MemberModel,
	t: TFunction,
	player2: User,
) {
	const isBet = betValue > 0;
	if (betValue > memberModel.wallet)
		return interaction.editReply({ content: t('velha.notEnoughCoins') });
}

const p1emoji = '❎';
const p2emoji = '⭕';
const restartButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
	new ButtonBuilder()
		.setEmoji('🔁')
		.setStyle(ButtonStyle.Success)
		.setLabel('Novo jogo')
		.setCustomId('restart'),
);

function setCooldown(userId: string) {
	usersCooldown.set(userId, Date.now() + 120_000);

	setTimeout(() => {
		if (usersCooldown.has(userId) && Date.now() >= usersCooldown.get(userId))
			usersCooldown.delete(userId);
	}, 120_000);
}

const deleteCooldown = (userId: string) => {
	if (usersCooldown.has(userId)) usersCooldown.delete(userId);
};

async function singlePlayer(
	interaction: CommandInteraction,
	memberDB: MemberModel,
	betValue: number,
): Promise<any> {
	let isBet = false;

	if (betValue !== 0) {
		if (betValue > memberDB.wallet)
			return interaction.editReply({
				content: `Saldo insuficiente para essa aposta`,
			});
		isBet = true;
		setCooldown(interaction.user.id);
	}

	let board = initBoard(); // row number | value

	const message = (await interaction.editReply({
		embeds: [gameEmbed(interaction.user)],
		components: gameButtons(board, true),
	})) as Message;

	const collector = message.createMessageComponentCollector({
		filter: (int) => int.isButton() && int.user.id === interaction.user.id,
		idle: 120_000,
	});

	let playerVictories = 0;
	let ties = 0;
	let botVictories = 0;
	let profit = 0;
	let round = 0;

	collector.on('collect', async (buttonInt: ButtonInteraction): Promise<any> => {
		buttonInt
			.deferReply({ ephemeral: false })
			.then(() => buttonInt.deleteReply().catch(() => {}));

		if (buttonInt.customId === 'restart') {
			if (isBet === true && memberDB.wallet < betValue) {
				interaction.editReply({
					content: `Saldo insuficiente para essa aposta`,
				});
				return collector.stop();
			}

			round = 0;
			board = initBoard();

			if (playerVictories > botVictories) {
				const botChoice = Math.floor(Math.random() * 9) + 1;

				board.set(botChoice, p2emoji);
				round++;
			}

			if (isBet) setCooldown(interaction.user.id);

			return interaction.editReply({
				embeds: [gameEmbed(interaction.user)],
				components: gameButtons(board),
			});
		}

		const playerChoice = parseInt(buttonInt.customId);
		board.set(playerChoice, p1emoji);
		round++;

		if (isWin(board, p1emoji)) {
			// player wins // game ends
			playerVictories++;

			let winEmbed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('❎ ⭕ | Jogo da velha')
				.setDescription(`Você ganhou!`)
				.addFields([
					{ name: 'Vitórias', value: playerVictories.toString() },
					{ name: 'Empates', value: ties.toString() },
					{ name: 'Derrotas', value: botVictories.toString() },
				]);

			if (isBet) {
				profit += betValue;
				memberDB.wallet += betValue;
				winEmbed.addFields([
					{
						name: 'Lucro da aposta',
						value: `${profit} ${GlobalVars.coinName}`,
					},
				]);

				await MemberRepo.save(memberDB);
			}
			let buttons = gameButtons(board, false, true);
			buttons.push(restartButton);

			return interaction.editReply({
				components: buttons,
				embeds: [winEmbed],
			});
		} else if (round === 9) {
			// Tie // game ends
			ties++;

			let tieEmbed = new EmbedBuilder()
				.setColor(Colors.Yellow)
				.setTitle('❎ ⭕ | Jogo da velha')
				.setDescription(`Deu velha! Empate`)
				.addFields([
					{ name: 'Vitórias', value: playerVictories.toString() },
					{ name: 'Empates', value: ties.toString() },
					{ name: 'Derrotas', value: botVictories.toString() },
				]);

			if (isBet)
				tieEmbed.addFields([
					{
						name: 'Lucro da aposta',
						value: `${profit} ${GlobalVars.coinName}`,
					},
				]);

			let buttons = gameButtons(board, false, true);
			buttons.push(restartButton);

			return interaction.editReply({
				components: buttons,
				embeds: [tieEmbed],
			});
		}

		// Else bot's turn

		const botChoice = botAI(board);

		board.set(botChoice, p2emoji);
		round++;

		if (isWin(board, p2emoji)) {
			// bot wins // game ends
			botVictories++;

			let loseEmbed = new EmbedBuilder()
				.setColor(Colors.Red)
				.setTitle('❎ ⭕ | Jogo da velha')
				.setDescription(`Você perdeu!`)
				.addFields([
					{ name: 'Vitórias', value: playerVictories.toString() },
					{ name: 'Empates', value: ties.toString() },
					{ name: 'Derrotas', value: botVictories.toString() },
				]);

			if (isBet) {
				profit -= betValue;
				memberDB.wallet -= betValue;
				loseEmbed.addFields([
					{
						name: 'Lucro da aposta',
						value: `${profit} ${GlobalVars.coinName}`,
					},
				]);

				await MemberRepo.save(memberDB);
			}

			let buttons = gameButtons(board, false, true);
			buttons.push(restartButton);

			return interaction.editReply({
				components: buttons,
				embeds: [loseEmbed],
			});
		}

		interaction.editReply({
			components: gameButtons(board),
			embeds: [gameEmbed(interaction.user)],
		});
		if (round === 9) {
			// Tie // game ends
			ties++;

			let tieEmbed = new EmbedBuilder()
				.setColor(Colors.Yellow)
				.setTitle('❎ ⭕ | Jogo da velha')
				.setDescription(`Deu velha! Empate`)
				.addFields([
					{ name: 'Vitórias', value: playerVictories.toString() },
					{ name: 'Empates', value: ties.toString() },
					{ name: 'Derrotas', value: botVictories.toString() },
				]);

			if (isBet)
				tieEmbed.addFields([
					{
						name: 'Lucro da aposta',
						value: `${profit} ${GlobalVars.coinName}`,
					},
				]);

			let buttons = gameButtons(board, false, true);
			buttons.push(restartButton);

			return interaction.editReply({
				components: buttons,
				embeds: [tieEmbed],
			});
		}
		// Else next round
	});
}

async function multiPlayer(
	interaction: CommandInteraction,
	player2: User,
	memberDB: MemberModel,
	betValue: number,
): Promise<any> {
	if (!interaction.guild.members.cache.has(player2.id))
		return interaction.editReply({
			content: '🤷‍♀️ | Usuário informado não encontrado no servidor',
		});

	if (player2.bot)
		return interaction.editReply({
			embeds: [
				{
					color: Colors.Yellow,
					title: '🤷‍♀️ | Acho que meus amigos bots não sabem jogar jogo da velha...',
					description:
						'...mas você pode jogar comigo!\n' +
						'Basta usar o comando novamente, sem mencionar um usuário',
				},
			],
		});

	if (interaction.user.id === player2.id)
		return interaction.editReply({
			embeds: [
				{
					color: Colors.Yellow,
					title: '🤷‍♀️ | Você não pode se auto-desafiar!',
					description:
						'...mas você pode jogar comigo!\n' +
						'Basta usar o comando novamente, sem mencionar um usuário',
				},
			],
		});

	let isBet = false;

	const player1 = interaction.user;
	const player1DB = memberDB;
	const player2DB = await MemberRepo.findOneBy({ id: player2.id });

	if (betValue !== 0) {
		if (betValue > player1DB.wallet)
			return interaction.editReply({
				content: `Você não tem ${GlobalVars.coinName} suficientes para essa aposta`,
			});

		if (betValue > player2DB.wallet)
			return interaction.editReply({
				content: `${player2.toString()} não tem ${GlobalVars.coinName} suficientes para essa aposta`,
			});

		isBet = true;
	}

	interaction.deleteReply();

	let p1Profit = 0;
	let p2Profit = 0;

	let p1Victories = 0;
	let ties = 0;
	let p2Victories = 0;
	let round = 0;

	let roundPlayer = player1;
	const board = new Collection<number, string>(); // row number | value

	const message = await interaction.channel.send({
		content: `${player1.toString()} vs ${player2.toString()}`,
		embeds: [gameEmbed(roundPlayer)],
		components: gameButtons(board, true),
	});

	const collector = message.createMessageComponentCollector({
		filter: (int) =>
			(int.user.id === player1.id || int.user.id === player2.id) &&
			int.isButton(),
		idle: 200_000,
	});

	let remainingPlayers = new Collection<string, User>();
	remainingPlayers.set(player1.id, player1);
	remainingPlayers.set(player2.id, player2);

	let wo = setTimeout(WO, 180_000);

	collector.on('collect', async (buttonInt): Promise<any> => {
		if (!buttonInt.isButton()) return;
		if (buttonInt.customId !== 'restart' && buttonInt.user.id !== roundPlayer.id)
			return;
		await buttonInt.deferReply({ ephemeral: false });

		if (
			buttonInt.customId === 'restart' &&
			remainingPlayers.has(buttonInt.user.id)
		) {
			if (
				isBet &&
				(betValue > player1DB.wallet || betValue > player2DB.wallet)
			) {
				message.edit({
					content: `${player1.username} ou ${player2.username} não tem ${GlobalVars.coinName} suficientes para essa aposta`,
				});
				return buttonInt.deleteReply().catch(() => {});
			}

			const otherPlayer = buttonInt.user.id === player1.id ? player2 : player1;

			remainingPlayers.delete(buttonInt.user.id);

			if (remainingPlayers.size > 0) {
				buttonInt.editReply({
					content: `Aguardando ${otherPlayer.toString()}...`,
				});
				setTimeout(() => {
					buttonInt.deleteReply().catch(() => {});
				}, 1000);
				return;
			} else {
				const lowestPlayer = p1Victories <= p2Victories ? player1 : player2;
				roundPlayer = lowestPlayer;
				round = 0;

				remainingPlayers.set(player1.id, player1);
				remainingPlayers.set(player2.id, player2);

				message.edit({
					content: `${player1.toString()} vs ${player2.toString()}`,
					embeds: [gameEmbed(roundPlayer)],
					components: gameButtons(board, true),
				});

				return buttonInt.deleteReply().catch(() => {});
			}
		} else if (
			buttonInt.customId === 'restart' &&
			!remainingPlayers.has(buttonInt.user.id)
		)
			return buttonInt.deleteReply().catch(() => {});

		clearTimeout(wo);

		const playerChoice = parseInt(buttonInt.customId);
		const playerEmoji = buttonInt.user.id === player1.id ? p1emoji : p2emoji;
		board.set(playerChoice, playerEmoji);
		round++;

		if (round <= 2 && isBet === true) setCooldown(buttonInt.user.id);

		if (isWin(board, playerEmoji)) {
			// Victory // Game ends

			const winner = buttonInt.user.id === player1.id ? player1 : player2;
			winner.id === player1.id ? p1Victories++ : p2Victories++;

			let winEmbed = new EmbedBuilder()
				.setColor(Colors.Green)
				.setTitle('❎ ⭕ | Jogo da velha')
				.setDescription(`${winner.toString()} ganhou!`)
				.addFields([
					{
						name: `Vitórias de ${player1.tag}`,
						value: `${p1Victories}`,
						inline: true,
					},
					{ name: `Empates`, value: `${ties}`, inline: true },
					{
						name: `Vitórias de ${player2.tag}`,
						value: `${p2Victories}`,
						inline: true,
					},
				]);

			if (isBet === true) {
				winner.id === player1.id
					? (p1Profit += betValue)
					: (p2Profit -= betValue);
				winner.id === player1.id
					? (player1DB.wallet += betValue)
					: (player2DB.wallet -= betValue);

				const winnerProfit = winner.id === player1.id ? p1Profit : p2Profit;

				winEmbed.addFields([
					{
						name: `Aposta:`,
						value: `${betValue} ${GlobalVars.coinName}`,
						inline: true,
					},
					{
						name: `Lucro de ${winner.tag}`,
						value: `${winnerProfit} ${GlobalVars.coinName}`,
						inline: true,
					},
				]);

				await MemberRepo.save(player1DB);
				await MemberRepo.save(player2DB);
			}

			let buttons = gameButtons(board, false, true);
			buttons.push(restartButton);

			message.edit({
				content: `${player1.toString()} vs ${player2.toString()}`,
				embeds: [winEmbed],
				components: buttons,
			});

			return buttonInt.deleteReply().catch(() => {});
		} else if (round === 9) {
			// Tie // Game ends
			ties++;

			let tieEmbed = new EmbedBuilder()
				.setColor(Colors.Yellow)
				.setTitle('❎ ⭕ | Jogo da velha')
				.setDescription(`Deu velha! Empate`)
				.addFields([
					{
						name: `Vitórias de ${player1.tag}`,
						value: `${p1Victories}`,
						inline: true,
					},
					{ name: `Empates`, value: `${ties}`, inline: true },
					{
						name: `Vitórias de ${player2.tag}`,
						value: `${p2Victories}`,
						inline: true,
					},
				]);

			let buttons = gameButtons(board, false, true);
			buttons.push(restartButton);

			message.edit({
				content: `${player1.toString()} vs ${player2.toString()}`,
				embeds: [tieEmbed],
				components: buttons,
			});

			return buttonInt.deleteReply().catch(() => {});
		} else if (round < 9) {
			// Next round // Game continues

			roundPlayer = roundPlayer === player1 ? player2 : player1;

			wo = setTimeout(WO, 180_000);

			message.edit({
				content: `${player1.toString()} vs ${player2.toString()}`,
				embeds: [gameEmbed(roundPlayer)],
				components: gameButtons(board),
			});

			return buttonInt.deleteReply().catch(() => {});
		}
	});

	async function WO() {
		const winner = roundPlayer === player1 ? player2 : player1;

		let woEmbed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle('❎ ⭕ | Jogo da velha')
			.setDescription(
				`${roundPlayer.toString()} abandonou o jogo!\n${winner.toString()} ganhou!`,
			);

		if (round < 2) {
			woEmbed
				.setColor(Colors.Yellow)
				.setDescription(
					`${roundPlayer.toString()} não respondeu!\nFim de jogo!`,
				);

			deleteCooldown(player1.id);
			deleteCooldown(player2.id);

			return message
				.edit({
					embeds: [woEmbed],
				})
				.catch(() => {});
		}

		if (isBet === true) {
			winner.id === player1.id
				? (p1Profit += betValue)
				: (p2Profit -= betValue);
			winner.id === player1.id
				? (player1DB.wallet += betValue)
				: (player2DB.wallet -= betValue);

			const winnerProfit = winner.id === player1.id ? p1Profit : p2Profit;

			woEmbed.addFields([
				{
					name: `Lucro de ${winner.tag}`,
					value: `${winnerProfit} ${GlobalVars.coinName}`,
					inline: true,
				},
			]);

			await MemberRepo.save(player1DB);
			await MemberRepo.save(player2DB);
		}

		let buttons = gameButtons(board, false, true);
		buttons.push(restartButton);

		message.edit({
			content: `${player1.toString()} vs ${player2.toString()}`,
			embeds: [woEmbed],
			components: buttons,
		});
	}
}

function initBoard(): Collection<number, string> {
	const board = new Collection<number, string>();

	for (let i = 1; i <= 9; i++) {
		board.set(i, GlobalVars.invisibleEmoji);
	}
	return board;
}

function gameButtons(
	board: Collection<number, string>,
	init?: boolean,
	end?: boolean,
): ActionRowBuilder<ButtonBuilder>[] {
	let rows: ActionRowBuilder<ButtonBuilder>[] = [
		new ActionRowBuilder(),
		new ActionRowBuilder(),
		new ActionRowBuilder(),
	];

	for (let i = 1; i <= 9; i++) {
		if (init) board.set(i, GlobalVars.invisibleEmoji);

		const emoji = board.get(i);
		const disabled = emoji !== GlobalVars.invisibleEmoji || end === true;

		const row = rows[Math.floor((i - 1) / 3)];

		row.addComponents(
			new ButtonBuilder()
				.setCustomId(i.toString())
				.setStyle(ButtonStyle.Primary)
				.setEmoji(emoji)
				.setDisabled(disabled),
		);
	}
	return rows;
}

function gameEmbed(roundPlayer: User) {
	let embed = new EmbedBuilder()
		.setColor(Colors.Yellow)
		.setTitle('❎ ⭕ | Jogo da velha')
		.setDescription(`Vez de ${roundPlayer.toString()}`);

	return embed;
}

const wins = [
	[1, 2, 3],
	[4, 5, 6],
	[7, 8, 9], // Horizontal
	[1, 4, 7],
	[2, 5, 8],
	[3, 6, 9], // Vertical
	[1, 5, 9],
	[3, 5, 7], // Diagonal
];

const isWin = (board: Collection<number, string>, playerEmoji: string): boolean =>
	wins.some((winOption) => winOption.every((x) => board.get(x) === playerEmoji));

function botAI(board: Collection<number, string>): number {
	function checkMove(
		checkBoard: Collection<number, string>,
		playerEmoji: string,
	): number {
		for (const winOption of wins) {
			if (
				winOption.filter((x) => checkBoard.get(x) === playerEmoji).length ===
					2 &&
				winOption.filter(
					(x) => checkBoard.get(x) === GlobalVars.invisibleEmoji,
				).length === 1
			) {
				return winOption.find(
					(x) => checkBoard.get(x) === GlobalVars.invisibleEmoji,
				);
			}
		}
		return 0;
	}

	let botChoice = checkMove(board, p2emoji); // Try to win first
	if (botChoice === 0) botChoice = checkMove(board, p1emoji); // Try to block player
	if (botChoice === 0)
		botChoice = board.filter((x) => x === GlobalVars.invisibleEmoji).randomKey(); // Random move

	return botChoice;
}
