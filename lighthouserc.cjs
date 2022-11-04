module.exports = {
	ci: {
		collect: {
			url: ['http://localhost:4173'],
			startServerCommand: 'npm run web-client:preview:static'
		},
		upload: {
			target: 'filesystem',
			outputDir: './lhci_report'
		}
	}
};
