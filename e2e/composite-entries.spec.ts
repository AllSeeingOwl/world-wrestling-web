import { test, expect } from '@playwright/test';

// Composite works list their parts on the entry page. The test finds a composite entry from
// the Home page rather than naming one, so it keeps working as entries change.
test('a composite entry shows its scope, date range and proposed citation', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.article-item', { hasText: /Composite work · \d+ parts/ }).first();
  test.skip((await card.count()) === 0, 'No composite entries in the registry.');

  const parts = Number(/· (\d+) parts/.exec(await card.innerText())![1]);
  await card.click();

  await expect(page.getByText(`Composite work · ${parts} parts`)).toBeVisible();
  await expect(page.locator('article header span', { hasText: 'Dates:' })).toContainText(' – ');

  const scope = page.getByRole('region', { name: 'Scope of this composite work' });
  await expect(scope.locator('ol > li')).toHaveCount(parts);

  // Dates in the scope list run oldest first.
  const dates = await scope
    .locator('time')
    .evaluateAll((els) => els.map((el) => el.getAttribute('datetime') || ''));
  expect(dates).toEqual([...dates].sort());

  const proposal = scope.getByText('Proposed for a Citation for Individual Merit');
  if ((await proposal.count()) > 0) {
    await expect(proposal).toHaveCount(1);
    await expect(scope).toContainText("the citation itself is the Board's decision");
  }
});
