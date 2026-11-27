import { test, expect } from '@playwright/test';

// Every entry page: "See also" shows at most three other entries, each with a reason, and every
// link leads to a real entry page. Entries are read from the Home page, not hard-coded.
test('See also links point to other existing entries', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('.article-item')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href') || ''));
  expect(hrefs.length).toBeGreaterThan(0);

  let pagesWithLinks = 0;
  for (const href of hrefs) {
    await page.goto(href);
    const seeAlso = page.getByRole('navigation', { name: 'See also' });
    if ((await seeAlso.count()) === 0) continue;
    pagesWithLinks++;

    const links = seeAlso.getByRole('link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
    for (let i = 0; i < count; i++) {
      const target = await links.nth(i).getAttribute('href');
      expect(target).not.toBe(href);
      expect(hrefs).toContain(target);
      await expect(links.nth(i)).toContainText(/Also (features|from) /);
    }
  }
  expect(pagesWithLinks).toBeGreaterThan(0);
});
