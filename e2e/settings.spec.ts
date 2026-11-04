import { expect, test } from '@playwright/test';

// An en-GB browser starts in English and Metric.
test.use({ locale: 'en-GB' });

// Reaching it from the header (and from the Menu on narrow screens) is covered by shell.spec.ts.
test('the settings page names itself in the title', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
  await expect(page).toHaveTitle('Settings – Woodworking Tools');
});

test('the Unit System is chosen with the arrow keys', async ({ page }) => {
  await page.goto('/settings');
  const unitSystem = page.getByRole('radiogroup', { name: 'Unit System' });
  await expect(unitSystem).toHaveAccessibleDescription(
    'Unit for numbers you type without one. You can always type any unit.',
  );
  await unitSystem.getByRole('radio', { name: 'Metric' }).focus();

  await page.keyboard.press('ArrowRight');

  await expect(unitSystem.getByRole('radio', { name: 'Imperial' })).toBeChecked();
  await expect(unitSystem.getByRole('radio', { name: 'Imperial' })).toBeFocused();
});

test('the Imperial precision is described by its hint', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByLabel('Imperial precision')).toHaveAccessibleDescription(
    'Smallest fraction shown in Imperial results.',
  );
});

test('switching the language translates the page in place, keeping focus on the picker', async ({
  page,
}) => {
  await page.goto('/settings');
  // A reload would reset this marker.
  await page.evaluate(() => {
    document.body.dataset['sameDocument'] = 'yes';
  });
  const language = page.getByRole('main').getByLabel('Language');

  await language.focus();
  await language.selectOption('es');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ajustes');
  await expect(page.getByRole('main').getByLabel('Idioma')).toBeFocused();
  await expect(page.locator('body')).toHaveAttribute('data-same-document', 'yes');
});
