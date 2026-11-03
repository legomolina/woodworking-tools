import axe from 'axe-core';
import { WCAG_AA_TAGS } from './wcag-aa-tags';

/**
 * Runs axe (WCAG 2.2 A and AA) on a rendered page or component and rejects
 * with one line per violation, naming the rule and the offending elements.
 *
 * jsdom has no layout or canvas, so colour contrast cannot be computed here and
 * is turned off: the e2e accessibility audit checks it in a real browser.
 */
export async function expectNoAxeViolations(element: Element): Promise<void> {
  const { violations } = await axe.run(element, {
    runOnly: { type: 'tag', values: WCAG_AA_TAGS },
    rules: { 'color-contrast': { enabled: false } },
  });

  if (violations.length > 0) {
    const lines = violations.map((violation) => {
      const rule = `- ${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}`;
      const elements = violation.nodes.map((node) => `    at ${node.target.join(' ')}`);
      return [rule, ...elements].join('\n');
    });
    throw new Error(`Expected no axe violations, found ${violations.length}:\n${lines.join('\n')}`);
  }
}
