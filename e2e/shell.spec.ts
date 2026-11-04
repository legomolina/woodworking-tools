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
    await expect(page.getByRole('button', { name: 'Menu', expanded: false })).toBeFocused();
  });

  test('the Menu stays open when the page it was opened on finishes loading', async ({ page }) => {
    // Hold back the home page's lazy-loaded script so the first navigation is still running
    // when the Menu opens, as on a slow connection.
    let releaseHomePage = (): void => undefined;
    const homePageHeld = new Promise<void>((resolve) => {
      releaseHomePage = resolve;
    });
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      if ((await response.text()).includes('wt-home-page')) {
        await homePageHeld;
      }
      await route.fulfill({ response });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    releaseHomePage();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Woodworking Tools');
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu', expanded: true })).toBeVisible();
  });

  test('the Menu closes when focus moves on past it, so it never covers what has focus', async ({
    page,
  }) => {
    await page.goto('/no-such-page');
    // The next Tab stop past the Menu is in the page, so wait for the page to be there.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Settings' })).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeFocused();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeHidden();
  });

  test('the Menu closes once one of its links is followed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();

    await page.getByRole('link', { name: 'Settings' }).click();

    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('link', { name: 'Settings' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Menu', expanded: false })).toBeVisible();
  });

  // 320 CSS px is a 1280px window at 400% zoom (WCAG 1.4.10 reflow): stricter than 200% text,
  // which the px-sized text tokens only reach through zoom. Spanish has the longer copy.
  for (const locale of ['en-US', 'es-ES']) {
    test.describe(locale, () => {
      test.use({ locale });

      for (const path of ['/', '/settings', '/no-such-page']) {
        test(`nothing scrolls sideways at ${path}`, async ({ page }) => {
          await page.goto(path);
          await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );

          expect(overflow).toBe(0);
        });
      }
    });
  }
});
