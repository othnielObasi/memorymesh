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

test('account panel explains cloud local and demo access rules', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^sign in$/i }).first().click();
  const panel = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Sign in to Cloud Memory' }),
  });

  await expect(panel.getByText('Cloud memory', { exact: true })).toBeVisible();
  await expect(panel.getByText('Private local memory', { exact: true })).toBeVisible();
  await expect(panel.getByText('Demo memory', { exact: true })).toBeVisible();
  await expect(panel.getByText('Requires sign in')).toBeVisible();
  await expect(panel.getByText('No cloud account is required for local mode')).toBeVisible();
  await expect(panel.getByText('Works without sign in')).toBeVisible();
});

test('local console marks missing local Cognee as fallback only', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/api/memory/status?backend=local_cognee&probe=true', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        backend: 'local_cognee',
        provider: 'Open-source Cognee',
        ready: false,
        mode: 'open_source',
        service_url_configured: false,
        api_key_configured: false,
        fallback_allowed: true,
        import_error: "No module named 'cognee'",
        notes: ['Uses open-source/self-hosted Cognee.'],
      }),
    });
  });

  await page.goto('/?mode=local');

  await expect(page.getByText('fallback only')).toBeVisible();
  await expect(page.getByText('Memory:').locator('..')).toContainText('fallback');
  await expect(page.getByText('Local Cognee is not available')).toBeVisible();
  await expect(page.getByText("Runtime detail: No module named 'cognee'")).toBeVisible();
});
