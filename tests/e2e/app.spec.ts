import { expect, test } from '@playwright/test';

test('redirects unauthenticated visitors to sign in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  await expect(page.locator('ion-content')).toContainText('Sign in to MeatUp');
});
