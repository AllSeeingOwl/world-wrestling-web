import { test, expect } from '@playwright/test';

// Link previews, search descriptions and the sitemap. Entries are read from the Home page.
test.describe('Sharing and search', () => {
  test('entry pages describe themselves for search and link previews', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('.article-item').first().getAttribute('href');
    await page.goto(href!);

    const meta = (selector: string) => page.locator(selector).getAttribute('content');
    const description = await meta('meta[name="description"]');
    expect(description).toBeTruthy();
    expect(description).not.toContain('preserves professional wrestling'); // not the site default
    expect(await meta('meta[property="og:description"]')).toBe(description);
    expect(await meta('meta[property="og:type"]')).toBe('article');
    expect(await meta('meta[property="og:title"]')).toContain('| Wrestling Heritage Registry');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https:\/\//);
  });

  test('the sitemap lists every entry', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('.article-item')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('<urlset');
    for (const href of hrefs) {
      const slug = href.replace(/\/$/, '').split('/').pop();
      expect(sitemap).toContain(`/${slug}/</loc>`);
    }
  });
});
