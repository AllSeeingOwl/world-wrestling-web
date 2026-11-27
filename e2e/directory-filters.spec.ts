import { test, expect, type Page } from '@playwright/test';

// The Directory is a React island (client:idle); its controls only render once hydrated.
async function openDirectory(page: Page) {
  await page.goto('/directory');
  await page.locator('#directory-search').waitFor();
}

const rows = (page: Page) => page.locator('table tbody tr');
const showing = (page: Page) => page.getByText(/^Showing \d+ of \d+ entr(y|ies)$/);

async function totalEntries(page: Page) {
  const text = await showing(page).innerText();
  return Number(/of (\d+)/.exec(text)![1]);
}

test.describe('Directory filters', () => {
  test('starts with every entry listed', async ({ page }) => {
    await openDirectory(page);
    const total = await totalEntries(page);
    await expect(rows(page)).toHaveCount(total);
    await expect(showing(page)).toHaveText(new RegExp(`^Showing ${total} of ${total} `));
  });

  test('section filter shows only that section', async ({ page }) => {
    await openDirectory(page);
    const select = page.locator('#directory-section');
    const section = await select.locator('option:not([value="all"])').first().getAttribute('value');
    await select.selectOption(section!);

    // The Section column is shown at desktop widths.
    const sections = await rows(page).locator('td:nth-child(5)').allInnerTexts();
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.every((s) => s.trim() === section)).toBe(true);
  });

  test('promotion filter shows only that promotion', async ({ page }) => {
    await openDirectory(page);
    const select = page.locator('#directory-promotion');
    const promotion = await select
      .locator('option:not([value="all"])')
      .first()
      .getAttribute('value');
    await select.selectOption(promotion!);

    // Filtering works on promotion groups (WWWF, WWF and WWE count as one).
    const groups = await rows(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-promotion-group'))
    );
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g === promotion)).toBe(true);
  });

  test('search finds an entry by title, and Clear filters resets', async ({ page }) => {
    await openDirectory(page);
    const total = await totalEntries(page);
    const title = (await rows(page).first().locator('td a').innerText()).trim();

    await page.locator('#directory-search').fill(title);
    await expect(rows(page).locator('td a', { hasText: title })).toBeVisible();

    await page.locator('#directory-search').fill('zzz-no-such-entry-zzz');
    await expect(page.getByText('No entries match these filters.')).toBeVisible();

    // With no results there are two "Clear filters" buttons; use the one in the filter panel.
    await page
      .getByRole('region', { name: 'Filter and arrange registry entries' })
      .getByRole('button', { name: 'Clear filters' })
      .click();
    await expect(rows(page)).toHaveCount(total);
  });

  test('fits a phone screen, with the promotion under each title', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDirectory(page);

    const fits = await page.evaluate(() => {
      const table = document.querySelector('table')!;
      return table.scrollWidth <= table.parentElement!.clientWidth;
    });
    expect(fits).toBe(true);

    await expect(page.getByRole('columnheader', { name: /Promotion/ })).toBeHidden();
    const firstPromotion = (await rows(page)
      .first()
      .locator('td:nth-child(3)')
      .textContent())!.trim();
    await expect(rows(page).first().locator('td').first()).toContainText(firstPromotion);
  });
});
