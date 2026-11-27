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

  test('the promotion filter shows only that promotion', async ({ page }) => {
    await openHome(page);
    const total = await cards(page).count();
    const filter = page.locator('#promotion-filter');
    const promotion = await filter
      .locator('option:not([value="all"])')
      .first()
      .getAttribute('value');

    await filter.selectOption(promotion!);
    const shown = await visibleCards(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-promotion'))
    );
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((p) => p === promotion)).toBe(true);

    await filter.selectOption('all');
    await expect(visibleCards(page)).toHaveCount(total);
  });

  test('WWWF, WWF and WWE are one choice in the promotion filter', async ({ page }) => {
    await openHome(page);
    const options = await page.locator('#promotion-filter option').allInnerTexts();
    expect(options.some((o) => /\((WWWF|WWF|WWE)\)$/.test(o))).toBe(false);
    const wwe = options.filter((o) => o.startsWith('WWE (including'));
    expect(wwe.length).toBeLessThanOrEqual(1);
  });

  test('entries are listed oldest first', async ({ page }) => {
    await openHome(page);
    const dates = await page
      .locator('.article-item time')
      .evaluateAll((els) => els.map((el) => el.getAttribute('datetime') || ''));
    expect(dates.length).toBeGreaterThan(1);
    expect(dates).toEqual([...dates].sort());
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

    await page.locator('#promotion-filter').selectOption(promotion!);
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
