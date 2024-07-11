import { gray, blue, red } from 'chalk';

const nowString = () =>
	new Date().toLocaleTimeString('pt-BR', {
		timeZone: 'America/Sao_Paulo',
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});

export const consoleLog = (origin: string, ...args: any[]) =>
	console.log(gray(nowString()), blue(`[${origin}]`), ...args);

export const consoleError = (origin: string, ...args: any[]) =>
	console.log(
		gray(nowString()),
		red(`[${origin}]`),
		...args,
		'\n',
		'-'.repeat(80),
	);
