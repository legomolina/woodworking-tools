import { expect, test } from '@playwright/test';

/** The app starts in the browser's language: Spanish for any Spanish variant, English otherwise. */
const BROWSER_LOCALES = [
  {
    locale: 'es-MX',
    lang: 'es',
    intro: 'Respuestas rápidas y exactas para el taller: convierte medidas y planifica tus cortes.',
  },
  {
    locale: 'fr-FR',
    lang: 'en',
    intro: 'Quick, exact answers for the workshop: convert measurements and plan your cuts.',
  },
] as const;

for (const { locale, lang, intro } of BROWSER_LOCALES) {
  test.describe(`${locale} browser`, () => {
    test.use({ locale });

    test(`shows the page in ${lang} and declares it as the page language`, async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText(intro)).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    });
  });
}

test.describe('switching the language in the footer', () => {
  test.use({ locale: 'en-US' });

  test('translates the page and its title without a reload', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page).toHaveTitle('Page not found – Woodworking Tools');
    // A reload would reset this marker.
    await page.evaluate(() => {
      document.body.dataset['sameDocument'] = 'yes';
    });

    await page.getByLabel('Language').selectOption('es');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página no encontrada');
    await expect(page).toHaveTitle('Página no encontrada – Woodworking Tools');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('body')).toHaveAttribute('data-same-document', 'yes');
  });
});
