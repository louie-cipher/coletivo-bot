module.exports = {
	apps: [
		{
			name: 'coletivo-bot',
			script: 'npm',
			args: ['run', 'production'],
			env: {
				NODE_ENV: 'prod',
				FORCE_COLOR: 1,
			},
		},
	],
};
