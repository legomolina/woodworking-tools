import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { appRoutes } from './routes';

/** WCAG 2.2 level A and AA rules, as required by CLAUDE.md. */
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Both themes are first-class: every route is audited in each. */
const COLOR_SCHEMES = ['light', 'dark'] as const;

for (const colorScheme of COLOR_SCHEMES) {
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
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

        // Proves the theme under test is the one applied (tokens.css sets it), so a
        // broken dark theme cannot pass as a second light run.
        expect(
          await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme),
        ).toBe(colorScheme);

        const { violations, incomplete } = await new AxeBuilder({ page })
          .withTags(WCAG_AA_TAGS)
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
