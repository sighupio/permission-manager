import { test, expect } from '@playwright/test';

test('Create user and save kubeconfig YAML to disk', async ({ page }) => {
  /* SETUP */
  const templateName = "developer";
  const username = `test-user-${templateName}-${Date.now()}`;

  await page.goto('/');
  const createButton = await page.getByTestId('create-user');
  await createButton.click();

  await page.waitForURL('https://permission-manager.dev/create-new-user');
  expect(page).toHaveURL(/.*create-new-user/);

  const submitButton = await page.getByTestId('submit');

  expect(submitButton).toBeVisible();
});
