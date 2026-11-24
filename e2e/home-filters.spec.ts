import { test, expect, type Page } from '@playwright/test';

// These tests read the entries and counts from the page rather than hard-coding them,
// so they keep passing as entries are added to the registry.

const cards = (page: Page) => page.locator('.article-item');
const visibleCards = (page: Page) => page.locator('.article-item:visible');

async function openHome(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Home page filters', () => {
  test('lists every registry section in charter order, with counts', async ({ page }) => {
    await openHome(page);
    const options = await page.locator('#section-filter option').allInnerTexts();
    expect(options[0]).toBe('All Sections');
    expect(options.slice(1).map((o) => o.replace(/ \(\d+\)$/, ''))).toEqual([
      'Registry of Excellence',
      'Registry of Infamy - Division A',
      'Registry of Infamy - Division B',
      'Registry of Homage & Influence',
    ]);
  });

  test('each section shows exactly its own entries, or the empty message', async ({ page }) => {
    await openHome(page);
    const total = await cards(page).count();
    const sectionFilter = page.locator('#section-filter');
    const options = await sectionFilter
      .locator('option')
      .evaluateAll((els) =>
        els.map((el) => ({ value: (el as HTMLOptionElement).value, label: el.textContent || '' }))
      );

    for (const { value, label } of options.filter((o) => o.value !== 'all')) {
      await sectionFilter.selectOption(value);
      const expected = Number(/\((\d+)\)$/.exec(label)?.[1]);

      await expect(visibleCards(page)).toHaveCount(expected);
      for (const section of await visibleCards(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-section'))
      )) {
        expect(section).toBe(value);
      }
      if (expected === 0) await expect(page.locator('#no-results')).toBeVisible();
      else await expect(page.locator('#no-results')).toBeHidden();
    }

    await sectionFilter.selectOption('all');
    await expect(visibleCards(page)).toHaveCount(total);
    await expect(page.locator('#no-results')).toBeHidden();
  });

  test('promotion buttons show only that promotion', async ({ page }) => {
    await openHome(page);
    const total = await cards(page).count();
    const button = page.locator('.promotion-btn:not([data-value="all"])').first();
    const promotion = await button.getAttribute('data-value');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    const shown = await visibleCards(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-promotion'))
    );
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((p) => p === promotion)).toBe(true);

    await page.locator('.promotion-btn[data-value="all"]').click();
    await expect(visibleCards(page)).toHaveCount(total);
  });

  test('era filter shows only that era', async ({ page }) => {
    await openHome(page);
    const era = await page
      .locator('#era-filter option:not([value="all"])')
      .first()
      .getAttribute('value');
    await page.locator('#era-filter').selectOption(era!);

    const shown = await visibleCards(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-era'))
    );
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((e) => e === era)).toBe(true);
  });

  test('filters combine, and an impossible combination shows the empty message', async ({
    page,
  }) => {
    await openHome(page);
    const first = cards(page).first();
    const promotion = await first.getAttribute('data-promotion');
    const section = await first.getAttribute('data-section');

    await page.locator(`.promotion-btn[data-value="${promotion}"]`).click();
    await page.locator('#section-filter').selectOption(section!);
    await expect(first).toBeVisible();

    // Pick a section this promotion has no entries in, if there is one.
    const sections = await page
      .locator('#section-filter option:not([value="all"])')
      .evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
    const promotionSections = await cards(page).evaluateAll(
      (els, p) =>
        els
          .filter((el) => el.getAttribute('data-promotion') === p)
          .map((el) => el.getAttribute('data-section')),
      promotion
    );
    const emptySection = sections.find((s) => !promotionSections.includes(s));
    test.skip(!emptySection, 'This promotion has entries in every section.');

    await page.locator('#section-filter').selectOption(emptySection!);
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.locator('#no-results')).toBeVisible();
  });

  test('does not scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflows).toBe(false);
  });
});
