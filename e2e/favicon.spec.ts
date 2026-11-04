import { expect, test } from '@playwright/test';

/** An ICO holding exactly one image: its header, image count and that image's size. */
function icoImages(body: Buffer): { count: number; width: number; height: number } {
  expect([...body.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  return { count: body.readUInt16LE(4), width: body[6], height: body[7] };
}

/** A PNG's size, read from its IHDR chunk. */
function pngSize(body: Buffer): { width: number; height: number } {
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

/** The URL a `<link>` points at, resolved against the page. */
async function declaredHref(page: import('@playwright/test').Page, selector: string) {
  const link = page.locator(selector);
  await expect(link).toHaveCount(1);
  return link.evaluate((element: HTMLLinkElement) => element.href);
}

// Single-page apps answer unknown paths with index.html: the content type and
// the file's own bytes prove the icon itself was served.

test('declares the SVG icon and serves it', async ({ page, request }) => {
  const response = await request.get(
    await declaredHref(page, 'link[rel="icon"][type="image/svg+xml"]'),
  );

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\/svg\+xml/);
  expect(await response.text()).toMatch(/^<svg [^>]*viewBox="0 0 32 32"/);
});

test('declares a single 32 x 32 ICO fallback and serves it', async ({ page, request }) => {
  const response = await request.get(await declaredHref(page, 'link[rel="icon"][sizes="32x32"]'));

  expect(response.status()).toBe(200);
  // Servers name the ICO type either way.
  expect(response.headers()['content-type']).toMatch(/^image\/(x-icon|vnd\.microsoft\.icon)/);
  expect(icoImages(await response.body())).toEqual({ count: 1, width: 32, height: 32 });
});

test('declares a 180 x 180 Apple touch icon and serves it', async ({ page, request }) => {
  const response = await request.get(await declaredHref(page, 'link[rel="apple-touch-icon"]'));

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\/png/);
  expect(pngSize(await response.body())).toEqual({ width: 180, height: 180 });
});
