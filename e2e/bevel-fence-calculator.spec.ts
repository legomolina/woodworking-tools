import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('typing the values shows the Fence Position and the other face', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle').fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');

  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.getByLabel('Long Face length').fill('300 mm');

  await expect(page.getByRole('heading', { level: 2, name: 'Fence Position' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Short Face' })).toBeVisible();
  await expect(page.getByText('281 mm', { exact: true })).toHaveCount(2);

  await page.getByRole('radio', { name: 'Short Face' }).check();
  await page.getByLabel('Short Face length').fill('281 mm');

  await expect(page.getByRole('heading', { level: 2, name: 'Long Face' })).toBeVisible();
  await expect(page.getByText('300 mm', { exact: true })).toBeVisible();
});

test('a value that cannot be used shows a message on its own field', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle').fill('60');

  await expect(page.getByLabel('Bevel Angle')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveText('The Bevel Angle must be between 0° and 45°.');

  await page.getByLabel('Bevel Angle').fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByLabel('Long Face length').fill('19 mm');

  await expect(page.getByRole('alert')).toContainText(
    'At 45° the Long Face must be longer than 19 mm.',
  );
});

test('the values are still there after leaving the Tool and coming back', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle').fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByRole('radio', { name: 'Short Face' }).check();
  await page.getByLabel('Short Face length').fill('281 mm');

  await page.getByRole('link', { name: 'Woodworking Tools' }).first().click();
  await page.getByRole('link', { name: 'Bevel Fence Calculator' }).first().click();

  await expect(page.getByLabel('Bevel Angle')).toHaveValue('45');
  await expect(page.getByLabel('Thickness', { exact: true })).toHaveValue('19 mm');
  await expect(page.getByRole('radio', { name: 'Short Face' })).toBeChecked();
  await expect(page.getByLabel('Short Face length')).toHaveValue('281 mm');
  await expect(page.getByRole('heading', { level: 2, name: 'Long Face' })).toBeVisible();
});
