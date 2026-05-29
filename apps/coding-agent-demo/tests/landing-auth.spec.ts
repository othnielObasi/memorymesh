import { expect, test } from '@playwright/test';

test('landing sign in and get started open account panels', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^sign in$/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Sign in to Cloud Memory' })).toBeVisible();

  await page.getByRole('button', { name: /^dismiss$/i }).click();
  await page.getByRole('button', { name: /^get started$/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Create your MemoryMesh workspace' })).toBeVisible();
});

test('local preview signup targets the MemoryMesh API port', async ({ page }) => {
  let signupHit = false;
  await page.route('http://127.0.0.1:8000/api/auth/signup', async route => {
    signupHit = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mms_test.token',
        token_type: 'bearer',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        user: {
          user_id: 'usr_test',
          name: 'Preview User',
          email: 'preview@example.com',
          role: 'owner',
          tenant: {
            organisation_id: 'org_test',
            workspace_id: 'wrk_test',
            project_id: 'prj_test',
            environment_id: 'prod',
            actor_id: 'usr_test',
          },
        },
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /^get started$/i }).first().click();
  await page.getByPlaceholder('Your name').fill('Preview User');
  await page.getByPlaceholder('Email').fill('preview@example.com');
  await page.getByPlaceholder('Password').fill('correct-password');
  await page.getByPlaceholder('Organisation').fill('Preview Org');
  await page.getByRole('button', { name: /^create account$/i }).click();

  await expect(page.getByText('Run an agent').first()).toBeVisible();
  expect(signupHit).toBe(true);
});
