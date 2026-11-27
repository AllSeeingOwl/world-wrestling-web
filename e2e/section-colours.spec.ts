import { test, expect } from '@playwright/test';

// Each registry section has its own colour: every card in a section shares one stripe colour,
// and different sections use different colours. The section name is shown on each card too.
test('cards are colour-coded consistently by registry section', async ({ page }) => {
  await page.goto('/');
  const cards = await page.locator('.article-item').evaluateAll((els) =>
    els.map((el) => {
      const card = el.querySelector('article')!;
      return {
        section: el.getAttribute('data-section') || '',
        stripe: getComputedStyle(card).borderLeftColor,
        label: (card.querySelector('span') as HTMLElement).innerText.trim(),
      };
    })
  );

  const colourBySection = new Map<string, string>();
  for (const { section, stripe, label } of cards) {
    expect(label.length).toBeGreaterThan(0);
    if (!colourBySection.has(section)) colourBySection.set(section, stripe);
    expect(stripe).toBe(colourBySection.get(section));
  }
  const colours = [...colourBySection.values()];
  expect(new Set(colours).size).toBe(colours.length);

  await expect(page.getByText('Colour key')).toBeVisible();
});

test('the Home colour key filters by section, and clicking again clears it', async ({ page }) => {
  await page.goto('/');
  const total = await page.locator('.article-item').count();
  const key = page.locator('[data-legend-for="section-filter"]');
  const button = key.locator('button[data-section]:enabled').first();
  const section = await button.getAttribute('data-section');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#section-filter')).toHaveValue(section!);
  const shown = await page
    .locator('.article-item:visible')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-section')));
  expect(shown.length).toBeGreaterThan(0);
  expect(shown.every((s) => s === section)).toBe(true);

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#section-filter')).toHaveValue('all');
  await expect(page.locator('.article-item:visible')).toHaveCount(total);
});

test('the Directory colour key sets the section filter', async ({ page }) => {
  await page.goto('/directory');
  await page.locator('#directory-search').waitFor();
  const button = page
    .locator('[data-legend-for="directory-section"] button[data-section]:enabled')
    .first();
  const section = await button.getAttribute('data-section');

  await button.click();
  await expect(page.locator('#directory-section')).toHaveValue(section!);
  await expect(page.getByText(/^Showing \d+ of \d+ entr/)).not.toContainText(
    /Showing (\d+) of \1 /
  );
});

test('the charter headings use the section colours', async ({ page }) => {
  await page.goto('/about');
  const bar = (id: string) =>
    page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).borderLeftColor);
  const colours = await Promise.all(
    [
      'section-i-the-registry-of-excellence',
      'division-a-failures-in-craft',
      'division-b-the-cautionary-archive',
      'section-iii-the-registry-of-homage--influence',
    ].map(bar)
  );
  expect(new Set(colours).size).toBe(4);
  for (const colour of colours) expect(colour).not.toBe('rgba(0, 0, 0, 0)');
});

test('the submit form shows the chosen section colour', async ({ page }) => {
  await page.goto('/contribute');
  await page.waitForSelector('astro-island:not([ssr])');
  await page.getByLabel('Registry section').selectOption('Registry of Homage & Influence');
  await expect(page.getByTestId('section-preview')).toContainText('Homage & Influence');
});
