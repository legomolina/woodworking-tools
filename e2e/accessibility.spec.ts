import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { WCAG_AA_TAGS } from '../src/testing/wcag-aa-tags';
import { appRoutes } from './routes';

/**
 * Both themes are first-class: every route is audited in each. `surface` is
 * the theme's page background from src/styles/tokens.json, as computed RGB.
 */
const THEMES = [
  { colorScheme: 'light', surface: 'rgb(247, 241, 232)' }, // #f7f1e8
  { colorScheme: 'dark', surface: 'rgb(27, 23, 19)' }, // #1b1713
] as const;

for (const { colorScheme, surface } of THEMES) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const { path, heading } of appRoutes) {
      test(`${path} renders and has no WCAG AA violations`, async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (error) => pageErrors.push(error.message));
        const consoleMessages: { type: string; text: string }[] = [];
        page.on('console', (message) =>
          consoleMessages.push({ type: message.type(), text: message.text() }),
        );

        await page.goto(path);

        // Proves this route's own page rendered: a blank page or a fallback page
        // (e.g. a mistyped path) would otherwise pass every accessibility rule.
        await expect(
          page.getByRole('heading', { level: 1, name: heading, exact: true }),
        ).toBeVisible();
        // Exactly one h1 per page: the shell must not add its own on a Tool page.
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

        // Proves the theme under test is the one applied, both its scheme and its
        // palette, so a broken dark theme cannot pass as a second light run.
        expect(
          await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme),
        ).toBe(colorScheme);
        await expect(page.locator('body')).toHaveCSS('background-color', surface);

        const { violations, incomplete } = await new AxeBuilder({ page })
          .withTags([...WCAG_AA_TAGS])
          .analyze();

        // axe reports contrast it cannot compute (gradients, background images)
        // as incomplete: surface it for a human to check instead of dropping it.
        for (const result of incomplete) {
          test.info().annotations.push({
            type: 'axe-incomplete',
            description: `${result.id}: ${result.nodes.map((node) => node.target.join(' ')).join(', ')}`,
          });
        }

        // A compact summary keeps failures readable for humans and agents.
        const summary = violations.map((violation) => ({
          rule: violation.id,
          impact: violation.impact,
          help: violation.help,
          elements: violation.nodes.map((node) => node.target.join(' ')),
        }));
        expect(summary).toEqual([]);

        const consoleErrors = consoleMessages.filter((message) => message.type === 'error');
        expect([...pageErrors, ...consoleErrors.map((message) => message.text)]).toEqual([]);
      });
    }
  });
}
