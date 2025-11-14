import type { Page } from '@playwright/test';

interface SearchParams {
  readonly [key: string]: string | number | boolean;
}

export async function loadPackagedRenderer(
  page: Page,
  searchParams?: SearchParams,
): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  const initialHref = await page.evaluate(() => window.location.href);
  const fallbackHref = initialHref === 'about:blank' ? page.url() : initialHref;
  const url = new URL(fallbackHref);
  url.search = '';

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, String(value));
    }
  }

  const targetUrl = url.toString();
  if (page.url() === targetUrl) {
    await page.waitForLoadState('domcontentloaded');
    return;
  }

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
}
