import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
test('account, custom link, analytics, QR, edit, filter, delete, settings and logout journey', async ({
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
  await expect(page.getByRole('group', { name: 'Total links', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create link', exact: true }).click();
  await page.getByLabel('Destination URL').fill('https://example.com/portfolio');
  await page.getByLabel('Title').fill('Portfolio');
  await page.getByLabel('Custom short code').fill('browser-' + Date.now());
  await page.getByRole('button', { name: 'Create short link', exact: true }).click();
  await expect(page.getByText('Portfolio', { exact: true })).toBeVisible();
  const href = await page.locator('a[href^="/r/"]').first().getAttribute('href');
  const redirected = await request.get(href!, { maxRedirects: 0 });
  expect(redirected.status()).toBe(302);
  expect(redirected.headers()['location']).toBe('https://example.com/portfolio');
  await expect(
    page.getByRole('group', { name: 'Total clicks', exact: true }).getByText('1', { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole('link', { name: 'Analytics', exact: true }).click();
  await expect(page).toHaveURL('/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics.' })).toBeVisible();
  await page.getByLabel('Analytics period').selectOption('30');
  await expect(page.getByRole('group', { name: 'Total clicks', exact: true })).toContainText('1');
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.screenshot({ path: 'test-results/screenshots/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'My links', exact: true }).click();
  await expect(page).toHaveURL('/links');
  await expect(page.getByRole('heading', { name: 'My links', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Portfolio.' })).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Total clicks', exact: true }).getByText('1', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to my links' }).click();
  await expect(page).toHaveURL('/links');
  await expect(page.getByRole('heading', { name: 'My links', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'QR code for Portfolio', exact: true }).click();
  await expect(page.getByRole('img', { name: /QR code for/ })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PNG' }).click();
  const download = await downloadPromise;
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Edit Portfolio', exact: true }).click();
  await page.getByLabel('Destination URL').fill('https://example.com/updated');
  await page.getByRole('switch').uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('cell', { name: 'Disabled', exact: true })).toBeVisible();
  await page.getByLabel('Filter by status').selectOption('disabled');
  await page.getByLabel('Search links').fill('no-such-title');
  await expect(page.getByText('No links match your filters.')).toBeVisible();
  await page.getByLabel('Search links').fill('Portfolio');
  await expect(page.getByText('Portfolio', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Portfolio', exact: true }).click();
  await page.getByRole('button', { name: 'Delete link', exact: true }).click();
  await expect(page.getByText('No links match your filters.')).toBeVisible();
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Overview.' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL('/settings');
  await page.getByLabel('Full name').fill('Alex Updated');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status')).toHaveText('Profile updated.');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
});

test('mobile navigation, keyboard dialog and password settings', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 375, height: 900 });
  const email = 'mobile-' + Date.now() + '@example.com';
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Mobile User');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Portfolio-secret-2026');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview.' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Total links', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/screenshots/dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Create link', exact: true }).click();
  await expect(page.getByLabel('Destination URL')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Create link', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Analytics', exact: true }).click();
  await expect(page).toHaveURL('/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics.' })).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL('/settings');
  await expect(page.getByRole('heading', { name: 'Settings.' })).toBeVisible();
  await page.getByLabel('Current password', { exact: true }).fill('Portfolio-secret-2026');
  await page.getByLabel('New password', { exact: true }).fill('Changed-secret-2026');
  await page.getByLabel('Confirm new password').fill('Changed-secret-2026');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Changed-secret-2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview.' })).toBeVisible();
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: /SignalHop API/ })).toBeVisible();
});
