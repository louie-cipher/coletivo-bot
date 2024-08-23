export default class GlobalVars {
	constructor() {}

	public static language: string = '';
	public static nonXPChannels: string[] = [];
	public static diceChannels: string = '';
	public static coinEmoji: string = '';
	public static coinName: string = '';
	public static invisibleEmoji: string = '<:invisible:1275212139421892608>';
	public static dailyCoins: number = 50;
	public static chatXP: number = 1;
	public static voiceXP: number = 1;
	public static chatXPCooldown: number = 10;
	public static voiceXPInterval: number = 300;
	public static levelRoles: Map<number, string> = new Map<number, string>();

	public static setLanguage(lang: string) {
		this.language = lang;
	}
	public static setNonXPChannels(channels: string[]) {
		this.nonXPChannels = channels;
	}
	public static setDiceChannels(channels: string) {
		this.diceChannels = channels;
	}
	public static setCoinEmoji(emoji: string) {
		this.coinEmoji = emoji;
	}
	public static setCoinName(name: string) {
		this.coinName = name;
	}
	public static setInvisibleEmoji(emoji: string) {
		this.invisibleEmoji = emoji;
	}
	public static setDailyCoins(coins: number) {
		this.dailyCoins = coins;
	}
	public static setChatXP(xp: number) {
		this.chatXP = xp;
	}
	public static setVoiceXP(xp: number) {
		this.voiceXP = xp;
	}
	public static setChatXPCooldown(cooldown: number) {
		this.chatXPCooldown = cooldown;
	}
	public static setVoiceXPInterval(interval: number) {
		this.voiceXPInterval = interval;
	}
}
