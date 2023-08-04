import { test, expect } from '@playwright/test';
import { text } from 'stream/consumers';

test('Create user and save kubeconfig YAML to disk', async ({ page }) => {
  /* SETUP */
  const templateName = "developer";
  const username = `test-user-${templateName}-${Date.now()}`;

  await page.goto('/');
  // const createButton = await page.getByTestId('create-user');
  const createButton = await page.getByText(/Create New User/);
  await createButton.click();

  await page.waitForURL('/create-new-user');
  expect(page).toHaveURL(/.*create-new-user/);

  const submitButton = await page.getByTestId('submit');
  // const inputName = await page.getByTestId('username');
  // inputName.type(username);

  expect(submitButton).toBeVisible();
  expect(submitButton).toBeDisabled();

  await page.getByRole('textbox').fill(username);

  const noneOption = await page.getByLabel('none');
  const readOnlyOption = await page.getByLabel('read-only');
  const readWriteOption = await page.getByLabel('read-write');

  expect(noneOption).toBeVisible();
  expect(noneOption).toBeChecked();

  expect(readOnlyOption).toBeVisible();
  expect(readWriteOption).toBeVisible();

  await page.click('button:is(:text("developer"), :text("operation"))');

  // Select operation role
  await page.click('#operation');

  await page.click('.euiComboBox');

  await page.click('.euiComboBoxOption__content:is(:text("default"))');

  expect(submitButton).toBeEnabled();

  await submitButton.click();

  const modal = await page.locator('.euiModal');

  expect(modal).toBeVisible();

});
