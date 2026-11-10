import { expect, test } from '@playwright/test';
test('foundation connects to real dependency health and Swagger', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A solid start for better links.' }),
  ).toBeVisible();
  await expect(page.getByText('PostgreSQL up · Redis up')).toBeVisible();
  await page.getByRole('link', { name: 'API documentation' }).click();
  await expect(page.getByRole('heading', { name: /SignalHop API/ })).toBeVisible();
  const response = await page.request.get('/docs-json');
  expect(Object.keys((await response.json()).paths).sort()).toEqual(['/health', '/health/live']);
});
test('foundation remains usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await expect(page.getByText('PostgreSQL up · Redis up')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('link', { name: 'Dependency health' })).toBeVisible();
});
