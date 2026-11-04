import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('the skip link is the first stop and moves focus to the main content', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press('Enter');

  await expect(page.getByRole('main')).toBeFocused();
  await expect(page).toHaveURL('/no-such-page');
  // The next Tab continues inside the main content.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeFocused();
});

test('the brand leads home from any page', async ({ page }) => {
  await page.goto('/no-such-page');

  await page.getByRole('banner').getByRole('link', { name: 'Woodworking Tools' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Woodworking Tools');
  await expect(page).toHaveTitle('Woodworking Tools');
});

test.describe('on a narrow screen', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('the Menu reveals the settings link and Escape closes it', async ({ page }) => {
    await page.goto('/');
    const settings = page.getByRole('link', { name: 'Settings' });
    await expect(settings).toBeHidden();

    await page.getByRole('button', { name: 'Menu' }).click();

    await expect(page.getByRole('button', { name: 'Menu', expanded: true })).toBeVisible();
    await expect(settings).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(settings).toBeHidden();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  });

  // 320 CSS px is a 1280px window at 400% zoom (WCAG 1.4.10 reflow), Spanish has the longer copy.
  for (const locale of ['en-US', 'es-ES']) {
    for (const path of ['/', '/no-such-page']) {
      test(`nothing scrolls sideways at ${path} in ${locale}`, async ({ browser }) => {
        const context = await browser.newContext({ locale, viewport: { width: 320, height: 640 } });
        const page = await context.newPage();
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );

        expect(overflow).toBe(0);
        await context.close();
      });
    }
  }
});
