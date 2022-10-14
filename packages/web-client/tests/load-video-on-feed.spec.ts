import { test, expect } from '@playwright/test';

test('Video source is properly loaded on feed', async ({ page }) => {
	await page.goto('http://localhost:4173');

	await page.waitForLoadState('networkidle');

	const videoEls = await page.locator('div .swiper-slide > player > video');
	const videoSrc = await videoEls.nth(0).getAttribute('src');

	expect(videoSrc?.includes('default.mp4'));
});
