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
