import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('typing the values shows the Fence Position and the other face', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle', { exact: true }).fill('45');
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
  await page.getByLabel('Bevel Angle', { exact: true }).fill('60');

  await expect(page.getByLabel('Bevel Angle', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.getByRole('alert')).toHaveText('The Bevel Angle must be between 0° and 45°.');

  await page.getByLabel('Bevel Angle', { exact: true }).fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByLabel('Long Face length').fill('19 mm');

  await expect(page.getByRole('alert')).toContainText(
    'At 45° the Long Face must be longer than 19 mm.',
  );
});

test('the front-view diagram follows the Bevel Angle and the face you give', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  const diagram = page.getByRole('img', { name: /^Front view of the saw/ });
  await expect(diagram).toHaveAccessibleName(/Type the Bevel Angle, the Thickness and a length/);

  await page.getByLabel('Bevel Angle', { exact: true }).fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByLabel('Long Face length').fill('300 mm');

  await expect(diagram).toHaveAccessibleName(/tilted 45 degrees.*Long Face is highlighted/);
  await expect(diagram.getByText('x · Long Face')).toBeVisible();

  await page.getByLabel('Bevel Angle', { exact: true }).fill('60');

  await expect(page.getByRole('alert')).toHaveText('The Bevel Angle must be between 0° and 45°.');
  await expect(diagram).toHaveAccessibleName(/tilted 45 degrees/);

  await page.getByLabel('Bevel Angle', { exact: true }).fill('0');
  await page.getByRole('radio', { name: 'Short Face' }).check();

  await expect(diagram).toHaveAccessibleName(/tilted 0 degrees.*Short Face is highlighted/);
});

test('the values are still there after leaving the Tool and coming back', async ({ page }) => {
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle', { exact: true }).fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByRole('radio', { name: 'Short Face' }).check();
  await page.getByLabel('Short Face length').fill('281 mm');

  await page.getByRole('link', { name: 'Woodworking Tools' }).first().click();
  await page.getByRole('link', { name: 'Bevel Fence Calculator' }).first().click();

  await expect(page.getByLabel('Bevel Angle', { exact: true })).toHaveValue('45');
  await expect(page.getByLabel('Thickness', { exact: true })).toHaveValue('19 mm');
  await expect(page.getByRole('radio', { name: 'Short Face' })).toBeChecked();
  await expect(page.getByLabel('Short Face length')).toHaveValue('281 mm');
  await expect(page.getByRole('heading', { level: 2, name: 'Long Face' })).toBeVisible();
});

test('copying the Fence Position confirms it politely', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/bevel-fence-calculator');
  await page.getByLabel('Bevel Angle', { exact: true }).fill('45');
  await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
  await page.getByLabel('Long Face length').fill('300 mm');

  await page.getByRole('button', { name: 'Copy the Fence Position in millimetres' }).click();

  await expect(page.getByRole('status')).toHaveText('Copied the Fence Position in millimetres');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('281 mm');
});

test.describe('the Imperial precision', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('offers each precision as a translated fraction of an inch', async ({ page }) => {
    await page.goto('/bevel-fence-calculator');

    await expect(page.getByLabel('Imperial precision').locator('option')).toHaveText([
      '1/8 in',
      '1/16 in',
      '1/32 in',
      '1/64 in',
    ]);
  });

  test('changing it on the page updates the results and the settings page', async ({ page }) => {
    await page.goto('/bevel-fence-calculator');
    await page.getByLabel('Bevel Angle', { exact: true }).fill('45');
    await page.getByLabel('Thickness', { exact: true }).fill('19 mm');
    await page.getByLabel('Long Face length').fill('301 mm');
    await expect(page.getByText('≈ 11 1/8"').first()).toBeVisible();

    await page.getByLabel('Imperial precision').selectOption('64');

    await expect(page.getByText('≈ 11 7/64"').first()).toBeVisible();
    await page.getByRole('link', { name: 'Settings' }).first().click();
    await expect(page.getByLabel('Imperial precision')).toHaveValue('64');
  });
});
