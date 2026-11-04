import { expect, test } from '@playwright/test';

/** Fonts are self-hosted: the app never asks a third party for anything. */
test('loads its fonts from /fonts/ and makes no external requests', async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? '').origin;
  const externalRequests: string[] = [];
  const fontRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== appOrigin) {
      externalRequests.push(request.url());
    }
    if (request.resourceType() === 'font') {
      fontRequests.push(url.pathname);
    }
  });

  await page.goto('/');
  // The page renders once its translations load; only then is there text to set.
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
  await page.evaluate(async () => document.fonts.ready);

  // The body text (Barlow 400) and the h1 (Barlow 600) actually rendered in
  // the self-hosted faces, not in a fallback.
  const loadedFaces = await page.evaluate(() =>
    [...document.fonts]
      .filter((face) => face.status === 'loaded')
      .map((face) => `${face.family.replaceAll('"', '')} ${face.weight}`),
  );
  expect(loadedFaces).toEqual(expect.arrayContaining(['Barlow 400', 'Barlow 600']));

  expect(fontRequests).toContain('/fonts/barlow/barlow-latin-400-normal.woff2');
  // The body font is preloaded, so the first paint can use it.
  await expect(
    page.locator(
      'link[rel="preload"][as="font"][href="/fonts/barlow/barlow-latin-400-normal.woff2"]',
    ),
  ).toHaveCount(1);
  expect(fontRequests.filter((path) => !path.startsWith('/fonts/'))).toEqual([]);
  expect(externalRequests).toEqual([]);
});
