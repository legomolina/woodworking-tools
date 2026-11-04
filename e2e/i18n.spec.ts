import { expect, test } from '@playwright/test';

/** The app starts in the browser's language: Spanish for any Spanish variant, English otherwise. */
const BROWSER_LOCALES = [
  {
    locale: 'es-MX',
    lang: 'es',
    intro: 'Calculadoras y utilidades para carpinteros. Próximamente.',
  },
  { locale: 'fr-FR', lang: 'en', intro: 'Calculators and utilities for woodworkers. Coming soon.' },
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
