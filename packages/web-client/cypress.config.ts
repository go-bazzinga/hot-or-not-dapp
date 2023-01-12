import { defineConfig } from 'cypress';
import { beforeRunHook } from 'cypress-mochawesome-reporter/lib';

export default defineConfig({
	video: false,
	env: {
		...process.env
	},

	reporter: '../../node_modules/mochawesome/src/mochawesome.js',
	reporterOptions: {
		reportPageTitle: 'Hot or Not Cypress Report',
		embeddedScreenshots: true,
		inlineAssets: true,
		saveAllAttempts: false,
		saveJson: true,
		saveHtml: true,
		overwrite: true,
		reportDir: 'cypress/reports/mochawesome-report'
	},
	e2e: {
		setupNodeEvents(on, config) {
			config.env.TEST_HOST = process.env.TEST_HOST;
			config.env.IC0_HOST = process.env.IC0_HOST;

			on('before:run', async (details) => {
				console.log('override before:run');
				await beforeRunHook(details);
			});
			on('task', {
				log(message) {
					console.log(message);

					return null;
				}
			});
			//TODO: Re add this

			// on('after:run', async () => {
			// 	// await afterRunHook();
			// });
			return config;
		}
	}
});
