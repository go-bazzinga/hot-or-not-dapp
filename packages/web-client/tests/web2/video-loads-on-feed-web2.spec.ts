import { test, expect } from '@playwright/test';

test('[Web2] Video source is properly loaded on feed', async ({ page }) => {
	await page.goto('https://hotornot.wtf');

	const videoEls = await page.locator('div .swiper-slide > player > video');
	const videoSrc = await videoEls.nth(0).getAttribute('src');

	expect(videoSrc?.includes('video.m3u8'));
});
