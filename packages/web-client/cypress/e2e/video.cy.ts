describe('Home Feed Tests', () => {
	beforeEach(() => {
		cy.visit('https://hotornot.wtf');
	});

	it('First video on feed has a valid source', () => {
		cy.get('player[i=0] > video').should('have.prop', 'src');
	});

	it('First video on the feed starts auto-playing', () => {
		cy.get('player[i=0] > video')
			.should('have.prop', 'paused', false)
			.and('have.prop', 'ended', false);
	});

	it('First video on a feed has a positive duration', () => {
		cy.get('player[i=0] > video').then(($video) => {
			expect(($video[0] as HTMLVideoElement).duration).to.be.gt(0);
		});
	});

	it('Measure first video load and show time on feed', () => {
		const t0 = performance.now();

		cy.get('splash-screen').should('be.visible');
		cy.get('splash-screen').should('not.exist');
		cy.get('player[i=0] > video')
			.should('have.prop', 'paused', false)
			.then(() => {
				cy.wrap(performance.now()).then((t1) => {
					cy.log(`Video is visible and started playing at ${t1 - t0} milliseconds.`);
				});
			});
	});

	it('Click to unmute video', () => {
		const video = cy.get('player[i=0] > video');
		video.should('have.prop', 'paused', false);
		video.should('have.prop', 'muted', true);
		video.click();
		video.should('have.prop', 'muted', false);
	});

	it('Scrolling on main feed', () => {
		Cypress.config('defaultCommandTimeout', 20000);
		cy.intercept({
			method: 'POST',
			url: 'https://ic0.app/api/v2/**'
		}).as('dataGetFirst');
		cy.wait('@dataGetFirst').then(() => {
			cy.wait(5000).then(() => {
				const vid0 = cy.get('player[i=0] > video');
				vid0.then(($video) => {
					$video[0].click();
				});

				const SCROLL_COUNT = 10;
				cy.wrap(Array(SCROLL_COUNT)).each((_, index) => {
					cy.get(`player[i=${index}] > video`)
						.and('have.prop', 'paused', false)
						.and('have.prop', 'muted', false);
					const nextVideo = cy.get(`player[i=${index + 1}] > video`);
					nextVideo.and('have.prop', 'paused', true);
					if (index !== 0) {
						cy.get(`player[i=${index - 1}] > video`).and('have.prop', 'paused', true);
					}
					nextVideo.scrollIntoView();
					cy.wait(1000);
				});
			});
		});
	});
});
