import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('typing the values shows the Fence Position and the other face', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle').fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');

  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.getByLabel('Length', { exact: true }).fill('300 mm');

  await expect(page.getByRole('heading', { level: 2, name: 'Fence Position' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Short Face' })).toBeVisible();
  await expect(page.getByText('281 mm')).toHaveCount(2);

  await page.getByRole('radio', { name: 'Short Face' }).check();
  await page.getByLabel('Length', { exact: true }).fill('281 mm');

  await expect(page.getByRole('heading', { level: 2, name: 'Long Face' })).toBeVisible();
  await expect(page.getByText('300 mm')).toBeVisible();
});

test('a value that cannot be used shows a message on its own field', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle').fill('60');

  await expect(page.getByLabel('Bevel Angle')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveText('The Bevel Angle must be between 0° and 45°.');

  await page.getByLabel('Bevel Angle').fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByLabel('Length', { exact: true }).fill('19 mm');

  await expect(page.getByRole('alert')).toContainText('The Long Face must be longer than 19 mm');
});
