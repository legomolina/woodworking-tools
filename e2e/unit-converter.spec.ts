import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('the Unit Converter is bookmarkable at its own address', async ({ page }) => {
  await page.goto('/unit-converter');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unit Converter');
  await expect(page.getByText('Type a length and see it in every unit at once.')).toBeVisible();
  await expect(page).toHaveTitle('Unit Converter – Woodworking Tools');
});

test('the home page lists the Unit Converter and opens it', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: /Unit Converter/ }).click();

  await expect(page).toHaveURL('/unit-converter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unit Converter');
});

test.describe('the navigation', () => {
  test.describe('on a wide screen', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('lists the Unit Converter', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');

      await page
        .getByRole('navigation', { name: 'Tools' })
        .getByRole('link', { name: 'Unit Converter' })
        .click();

      await expect(page).toHaveURL('/unit-converter');
    });
  });

  test.describe('on a narrow screen', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('lists the Unit Converter in the Menu', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
      await page.getByRole('button', { name: 'Menu' }).click();

      await page
        .getByRole('navigation', { name: 'Tools' })
        .getByRole('link', { name: 'Unit Converter' })
        .click();

      await expect(page).toHaveURL('/unit-converter');
    });
  });
});

test('typing a length shows it in every unit, and a bad one shows a message', async ({ page }) => {
  await page.goto('/unit-converter');
  const field = page.getByLabel('Length');

  await field.fill('3 1/2"');
  await expect(page.getByText('88.9 mm')).toBeVisible();
  await expect(page.getByText('≈ 0.089 m')).toBeVisible();

  await field.fill('abc');
  await expect(page.getByText("That length can't be read.", { exact: false })).toBeVisible();
  await expect(page.getByText('88.9 mm')).toBeHidden();
});

test.describe('the Imperial precision', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('offers each precision as a translated fraction of an inch', async ({ page }) => {
    await page.goto('/unit-converter');

    await expect(page.getByLabel('Imperial precision').locator('option')).toHaveText([
      '1/8 in',
      '1/16 in',
      '1/32 in',
      '1/64 in',
    ]);
  });

  test('changing it on the page updates the results and the settings page', async ({ page }) => {
    await page.goto('/unit-converter');
    await page.getByLabel('Length').fill('90 mm');
    await expect(page.getByText('≈ 3 9/16"').first()).toBeVisible();

    await page.getByLabel('Imperial precision').selectOption('64');

    await expect(page.getByText('≈ 3 35/64"').first()).toBeVisible();
    await page.getByRole('link', { name: 'Settings' }).first().click();
    await expect(page.getByLabel('Imperial precision')).toHaveValue('64');
  });
});

test('the typed length is still there after visiting the home page and coming back', async ({
  page,
}) => {
  await page.goto('/unit-converter');
  await page.getByLabel('Length').fill('3 1/2"');
  await expect(page.getByText('88.9 mm')).toBeVisible();

  await page
    .getByRole('banner')
    .getByRole('link', { name: /Woodworking Tools/ })
    .first()
    .click();
  await expect(page).toHaveURL('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Unit Converter/ })
    .click();

  await expect(page.getByLabel('Length')).toHaveValue('3 1/2"');
  await expect(page.getByText('88.9 mm')).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Length')).toHaveValue('');
});

test('each Copy button sits at the end of its result row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/unit-converter');
  await page.getByLabel('Length').fill('3 1/2"');
  await expect(page.getByText('88.9 mm')).toBeVisible();

  const copy = page.getByRole('button', { name: 'Copy millimetres' });
  const rowBox = await copy.locator('xpath=ancestor::div[1]').boundingBox();
  const buttonBox = await copy.boundingBox();

  expect(rowBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  // The row has 16px of padding-inline: the button's end edge sits just inside it.
  const rowEnd = (rowBox?.x ?? 0) + (rowBox?.width ?? 0);
  const buttonEnd = (buttonBox?.x ?? 0) + (buttonBox?.width ?? 0);
  expect(rowEnd - buttonEnd).toBeLessThanOrEqual(16);
});
