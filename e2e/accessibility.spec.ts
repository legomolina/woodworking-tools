import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { appRoutes } from './routes';

/** WCAG 2.2 level A and AA rules, as required by CLAUDE.md. */
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const route of appRoutes) {
  test(`${route} renders and has no WCAG AA violations`, async ({ page }) => {
    await page.goto(route);

    // Guards against auditing a blank page: an app that fails to render
    // would otherwise pass every accessibility rule.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();

    // A compact summary keeps failures readable for humans and agents.
    const summary = violations.map((violation) => ({
      rule: violation.id,
      impact: violation.impact,
      help: violation.help,
      elements: violation.nodes.map((node) => node.target.join(' ')),
    }));
    expect(summary).toEqual([]);
  });
}
