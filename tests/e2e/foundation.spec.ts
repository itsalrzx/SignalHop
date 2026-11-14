import { expect, test } from '@playwright/test';
test('account, first link, redirect, reload recovery and logout journey', async ({
  page,
  request,
}) => {
  test.setTimeout(60000);
  const email = 'browser-' + Date.now() + '@example.com';
  await page.goto('/');
  await expect(page).toHaveURL('/login');
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page).toHaveURL('/register');
  await page.getByLabel('Full name').fill('Alex Morgan');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Portfolio-secret-2026');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview.' })).toBeVisible();
  await page.getByRole('button', { name: 'Create link', exact: true }).click();
  await page.getByLabel('Destination URL').fill('https://example.com/portfolio');
  await page.getByLabel('Title').fill('Portfolio');
  await page.getByRole('button', { name: 'Create short link', exact: true }).click();
  await expect(page.getByText('Portfolio', { exact: true })).toBeVisible();
  const href = await page.locator('a[href^="/r/"]').first().getAttribute('href');
  const redirected = await request.get(href!, { maxRedirects: 0 });
  expect(redirected.status()).toBe(302);
  expect(redirected.headers()['location']).toBe('https://example.com/portfolio');
  await page.getByRole('link', { name: 'My links', exact: true }).click();
  await expect(page).toHaveURL('/links');
  await expect(page.getByRole('heading', { name: 'My links', exact: true })).toBeVisible();
  await expect(page.getByText('Portfolio', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My links', exact: true })).toBeVisible();
  await expect(page.getByText('Portfolio', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
});

test('auth and dashboard remain usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: /SignalHop API/ })).toBeVisible();
});
