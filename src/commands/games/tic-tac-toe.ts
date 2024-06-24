import SlashCommand from 'classes/SlashCommand';
import GlobalVars from 'classes/globalVars';
import { MemberModel } from 'db/entities';
import { MemberRepo } from 'db/repositories';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { consoleLog } from 'utils/log';

export default new SlashCommand({
	data: new SlashCommandBuilder()
		.setName('tic-tac-toe')
		.setDescription('play tic-tac-toe')
		.setNameLocalizations({ 'pt-BR': 'velha' })
		.setDescriptionLocalizations({ 'pt-BR': 'jogar jogo da velha' })
		.addUserOption((option) =>
			option
				.setName('opponent')
				.setDescription('Oponente da partida')
				.setRequired(false),
		)
		.addIntegerOption((option) =>
			option
				.setName('bet')
				.setDescription('quantidade de moedas a apostar')
				.setMinValue(1)
				.setRequired(false),
		),
	execute: async ({ interaction, memberModel, t }) => {
		interaction
			.deferReply({ ephemeral: false })
			.then(() => interaction.deleteReply());

		const player2 = interaction.options.getUser('opponent', false) || null;
		const bet = interaction.options.getInteger('bet', false) || 0;

		if (player2 && player2.id === memberModel.id)
			return interaction.reply({ content: t('games.cantPlayAgainstSelf') });

		if (player2 && player2.bot)
			return interaction.reply({ content: t('games.cantPlayAgainstBot') });

		const p1Model = memberModel;
		const p2Model = player2 ? await MemberRepo.findOrCreate(player2) : null;

		if (bet > p1Model.wallet)
			return interaction.reply({ content: t('games.notEnoughCoins') });

		if (player2 && bet > p2Model.wallet)
			return interaction.reply({ content: t('games.notEnoughCoinsOpponent') });

		const generateEmbed = (description?: string) =>
			new EmbedBuilder()
				.setColor(Colors.Yellow)
				.setTitle(t('ticTacToe.title'))
				.setDescription(description || null);

		const game = new TicTacToeGame();

		let messageContent = interaction.user.toString();
		if (player2) messageContent += ' vs ' + player2.toString();

		const embedDesc = player2 ? 'games.turnOf' : 'ticTacToe.description';

		const message = await interaction.channel.send({
			content: messageContent,
			embeds: [generateEmbed(t(embedDesc, { playerId: p1Model.id }))],
			components: gameButtons(game),
		});

		const collector = message.createMessageComponentCollector({
			filter: (i) => i.user.id === p1Model.id || i.user.id === player2.id,
			componentType: ComponentType.Button,
			idle: 200_000,
		});

		collector.on('collect', async (buttonInteraction) => {
			await buttonInteraction.deferReply({ ephemeral: false });
			const playerChoice = parseInt(buttonInteraction.customId, 10);

			buttonInteraction.deleteReply();

			game.play(playerChoice, game.currentPlayer);

			// check player win
			if (game.isWin()) {
				consoleLog('TIC-TAC-TOE', 'player win');

				if (p2Model && bet)
					await updateBets(p1Model, p2Model, game.currentPlayer === 1);

				const description = p2Model
					? t('ticTacToe.win', { playerId: p1Model.id })
					: t('ticTacToe.winSingle');

				return message.edit({
					embeds: [generateEmbed(description)],
					components: [...gameButtons(game), restartButton],
				});
			}

			// check tie
			if (game.isTie()) {
				return message.edit({
					embeds: [generateEmbed(t('ticTacToe.tie'))],
					components: [...gameButtons(game), restartButton],
				});
			}

			// change player
			if (p2Model)
				return message.edit({
					embeds: [
						generateEmbed(
							t('games.roundOf', {
								playerId: player2 ? p2Model.id : p1Model.id,
							}),
						),
					],
					components: gameButtons(game),
				});

			game.botPlay();

			// check bot win
			if (game.isWin()) {
				await updateBets(p1Model, p2Model, game.currentPlayer === 1);

				return message.edit({
					embeds: [generateEmbed(t('ticTacToe.botWin'))],
					components: [...gameButtons(game), restartButton],
				});
			}

			// check tie
			if (game.isTie()) {
				return message.edit({
					embeds: [generateEmbed(t('ticTacToe.tie'))],
					components: [...gameButtons(game), restartButton],
				});
			}

			// next round
			consoleLog('TIC-TAC-TOE', 'next round');
			message.edit({
				embeds: [generateEmbed(t('games.turnOf', { playerId: p1Model.id }))],
				components: gameButtons(game),
			});
		});

		async function updateBets(
			p1Model: MemberModel,
			p2Model?: MemberModel,
			p1Win = true,
		) {
			if (p1Win) {
				p1Model.wallet += bet;
				if (p2Model) p2Model.wallet -= bet;
			} else {
				p1Model.wallet -= bet;
				if (p2Model) p2Model.wallet += bet;
			}

			await p1Model.save();
			if (p2Model) await p2Model.save();
		}
	},
});

function gameButtons(game: TicTacToeGame) {
	const rows: ActionRowBuilder<ButtonBuilder>[] = [];
	for (let i = 0; i < 3; i++) {
		const row = new ActionRowBuilder<ButtonBuilder>();
		for (let j = 0; j < 3; j++) {
			const slot = game.board[i * 3 + j];
			row.addComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Primary)
					.setEmoji(game.emojis[slot.player])
					.setCustomId(slot.pos.toString())
					.setDisabled(slot.player !== 0 || game.finished),
			);
		}
		rows.push(row);
	}
	return rows;
}

const restartButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
	new ButtonBuilder()
		.setEmoji('🔁')
		.setStyle(ButtonStyle.Success)
		.setLabel('Novo jogo')
		.setCustomId('restart'),
);

const winConditions = [
	// horizontal
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	// vertical
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	// diagonal
	[0, 4, 8],
	[2, 4, 6],
];

class TicTacToeSlot {
	public pos: number;
	public player: number;
	constructor(pos: number, player: number = 0) {
		this.pos = pos;
		this.player = player;
	}
}

class TicTacToeGame {
	public board: TicTacToeSlot[];
	public currentPlayer: number = 1;
	public emojis: string[];
	public round: number;

	public finished: boolean;
	public p1Wins: number;
	public p2Wins: number;
	public ties: number;

	constructor() {
		this.emojis = [GlobalVars.invisibleEmoji, '❎', '⭕'];
		this.newGame();
		this.currentPlayer = 1;
	}

	public newGame() {
		this.board = [];
		for (let i = 0; i < 9; i++) this.board.push(new TicTacToeSlot(i));
		this.round = 0;

		if (this.p1Wins === this.p2Wins)
			this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
		else this.currentPlayer = this.p1Wins > this.p2Wins ? 2 : 1;

		this.finished = false;
	}

	public play(pos: number, player: number) {
		this.board[pos].player = player;
		this.currentPlayer = player === 1 ? 2 : 1;
		this.round++;
	}

	public botPlay() {
		const emptySlots = this.board.filter((slot) => slot.player === 0);
		const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
		this.play(randomSlot.pos, 2);
	}

	public isTie(): boolean {
		return this.round === 9;
	}

	public isWin(): boolean {
		for (const condition of winConditions) {
			const [a, b, c] = condition;
			if (
				this.board[a].player &&
				this.board[a].player === this.board[b].player &&
				this.board[a].player === this.board[c].player
			) {
				this.finished = true;
				this.board[a].player === 1 ? this.p1Wins++ : this.p2Wins++;
			}
		}
		return false;
	}
}
