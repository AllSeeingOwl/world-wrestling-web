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
