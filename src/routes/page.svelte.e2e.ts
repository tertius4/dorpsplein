import { expect, test } from '@playwright/test';

test('tuisblad wys die werk-kategorieë', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dorpsplein');
	await expect(page.getByRole('listitem').filter({ hasText: 'Konstruksie' })).toBeVisible();
});
