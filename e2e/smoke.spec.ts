import { expect, test } from '@playwright/test';

test('customer landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('body')).toContainText('TADKA');
});

test('authentication page is reachable', async ({ page }) => {
  await page.goto('/auth');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.locator('body')).toContainText(/login|sign up|create account/i);
});

test('restaurant discovery page is reachable', async ({ page }) => {
  await page.goto('/restaurants');
  await expect(page).toHaveURL(/\/restaurants$/);
  await expect(page.locator('body')).toContainText(/restaurant|food/i);
});
