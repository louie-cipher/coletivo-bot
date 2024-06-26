module.exports = {
	apps: [
		{
			name: 'coletivo-bot',
			script: 'dist/index.js',
			env: {
				NODE_ENV: 'prod',
				FORCE_COLOR: 1,
			},
		},
	],
};
