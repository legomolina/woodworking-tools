import { expect, test } from '@playwright/test';

/** The icons the page declares, each with the type its file must be served as. */
const declaredIcons = [
  { selector: 'link[rel="icon"][type="image/svg+xml"]', contentType: /^image\/svg\+xml/ },
  // Servers name the ICO type either way.
  {
    selector: 'link[rel="icon"][sizes="32x32"]',
    contentType: /^image\/(x-icon|vnd\.microsoft\.icon)/,
  },
  { selector: 'link[rel="apple-touch-icon"]', contentType: /^image\/png/ },
];

for (const { selector, contentType } of declaredIcons) {
  test(`declares ${selector} and serves it`, async ({ page, request }) => {
    await page.goto('/');

    const link = page.locator(selector);
    await expect(link).toHaveCount(1);
    const href = await link.evaluate((element: HTMLLinkElement) => element.href);

    const response = await request.get(href);
    expect(response.status()).toBe(200);
    // Single-page apps answer unknown paths with index.html: the type proves
    // the icon itself was served.
    expect(response.headers()['content-type']).toMatch(contentType);
  });
}
