import { expect, test } from '@playwright/test';

test('landing sign in and get started open account panels', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^sign in$/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Sign in to Cloud Memory' })).toBeVisible();

  await page.getByRole('button', { name: /^dismiss$/i }).click();
  await page.getByRole('button', { name: /^get started$/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Create your MemoryMesh workspace' })).toBeVisible();
});
