import { test, expect, type Page } from '@playwright/test';

// The contribute form is a React island (client:load). Astro removes the island's `ssr`
// attribute once it has hydrated; typing before then would be lost.
async function openForm(page: Page) {
  await page.goto('/contribute');
  await page.waitForSelector('astro-island:not([ssr])');
}

function isoDateYearsFromNow(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

const submit = (page: Page) => page.getByRole('button', { name: 'Check & prepare entry' }).click();

const ARTICLE = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ');

async function fillValidEntry(page: Page, title: string) {
  await page.getByLabel('Entry title').fill(title);
  await page.getByLabel('Event date').fill('1990-05-01');
  await page.getByLabel('Promotion or creator').fill('WCW');
  await page.getByLabel('People involved').fill('Wrestler One\nWrestler Two');
  await page.getByLabel('Registry section').selectOption('Registry of Excellence');
  await page.getByLabel('Significance').selectOption('Historical Significance');
  await page.getByLabel('One-sentence summary').fill('A test entry used by the end-to-end tests.');
  await page.getByLabel('Source material').fill('Test broadcast');
  await page.getByLabel('Historical context statement').fill('It matters for testing.');
  await page.getByLabel('Article').fill(ARTICLE);
}

test.describe('Contribute form', () => {
  test('does not offer the Cautionary Archive (Division B)', async ({ page }) => {
    await openForm(page);
    const options = await page.locator('#contribute-registry-section option').allInnerTexts();
    expect(options).toEqual([
      'Choose a section…',
      'Registry of Excellence',
      'Registry of Infamy - Division A',
      'Registry of Homage & Influence',
    ]);
  });

  test('shows the charter Do and Don’t lists', async ({ page }) => {
    await openForm(page);
    const sidebar = page.getByRole('complementary', { name: 'Before you start' });
    await expect(sidebar.getByRole('heading', { name: 'Do', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('heading', { name: "Don't", exact: true })).toBeVisible();
    await expect(sidebar).toContainText('at least five years old');
  });

  test('explains how selection works', async ({ page }) => {
    await openForm(page);
    const note = page.getByRole('region', { name: 'How selection works' });
    await expect(note).toContainText("The charter's yearly cycle is the goal.");
    await expect(note).toContainText('For now, editors review each submission.');
    await expect(note).toContainText("The Cautionary Archive isn't open to nominations.");
    await expect(note.getByRole('link', { name: 'Registry Charter' })).toHaveAttribute(
      'href',
      /\/about$/
    );
  });

  test('lists every missing required field when submitted empty', async ({ page }) => {
    await openForm(page);
    await submit(page);
    const summary = page.getByRole('alert');
    await expect(summary).toBeFocused();
    for (const message of [
      'Give the entry a title.',
      'Enter the date of the event.',
      'Name the promotion or creator.',
      'Choose a registry section.',
      'List at least one person involved.',
      'Write a one-sentence summary.',
      'Say where the information comes from.',
      'Explain why this moment is historically significant.',
      'Write at least 100 words (currently 0).',
    ]) {
      await expect(summary).toContainText(message);
    }
  });

  test('significance options and hint follow the chosen section', async ({ page }) => {
    await openForm(page);
    const significance = page.getByLabel('Significance');
    await expect(significance).toBeDisabled();

    await page.getByLabel('Registry section').selectOption('Registry of Infamy - Division A');
    await expect(significance.locator('option')).toHaveText([
      'Choose…',
      'Conceptual Failure',
      'Technical Failure',
      'Contextual Failure',
      "So Bad It's Good",
    ]);

    await significance.selectOption('Technical Failure');
    await expect(page.locator('#contribute-significance-hint')).toContainText(
      'collapsed through error, accident or poor planning'
    );

    // A section with one type of significance picks it automatically.
    await page.getByLabel('Registry section').selectOption('Registry of Homage & Influence');
    await expect(significance).toHaveValue('Homage & Influence');
  });

  test('rejects works less than five years old', async ({ page }) => {
    await openForm(page);
    await page.getByLabel('Event date').fill(isoDateYearsFromNow(-2));
    await submit(page);
    await expect(page.locator('#contribute-date-error')).toHaveText(
      'Works must be at least 5 years old to be nominated, so their legacy can be judged.'
    );
  });

  test('rejects dates in the future', async ({ page }) => {
    await openForm(page);
    await page.getByLabel('Event date').fill(isoDateYearsFromNow(1));
    await submit(page);
    await expect(page.locator('#contribute-date-error')).toHaveText(
      'The date cannot be in the future.'
    );
  });

  test('accepts only a decade in the Decade field', async ({ page }) => {
    await openForm(page);
    await page.getByLabel('Decade').fill('Attitude Era');
    await submit(page);
    await expect(page.locator('#contribute-era-error')).toHaveText("Use a decade, like '1990s'");

    await page.getByLabel('Decade').fill('1990s');
    await submit(page);
    await expect(page.locator('#contribute-era-error')).toHaveCount(0);
  });

  test('rejects a title that is already in the registry', async ({ page }) => {
    await page.goto('/');
    const existingTitle = (await page.locator('.article-item h2').first().innerText()).trim();

    await openForm(page);
    await page.getByLabel('Entry title').fill(existingTitle);
    await submit(page);
    await expect(page.locator('#contribute-title-error')).toHaveText(
      'An entry with this title already exists. Choose a more specific title.'
    );
  });

  test('prepares a valid entry for a pull request', async ({ page }) => {
    await openForm(page);
    const title = `End-to-end Test Entry ${Date.now()}`;
    await fillValidEntry(page, title);
    await submit(page);

    await expect(page.getByRole('alert')).toHaveCount(0);
    const ready = page.getByRole('region', { name: 'Your entry is ready' });
    await expect(ready).toBeFocused();

    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    await expect(ready.getByRole('button', { name: `Download ${filename}` })).toBeVisible();

    const prLink = ready.getByRole('link', { name: /Open a pull request on GitHub/ });
    const href = await prLink.getAttribute('href');
    expect(href).toContain('/new/main/src/content/archive?filename=');
    expect(href).toContain(encodeURIComponent(filename));

    await ready.getByText('Preview the Markdown').click();
    const preview = ready.locator('pre');
    await expect(preview).toContainText(title);
    await expect(preview).toContainText('Registry of Excellence');
    await expect(preview).toContainText('Historical Significance');
  });

  test('saves a draft and restores it after a reload', async ({ page }) => {
    await openForm(page);
    await page.getByLabel('Entry title').fill('My unfinished draft');
    await page.reload();
    await page.waitForSelector('astro-island:not([ssr])');

    await expect(page.getByText('Your saved draft has been restored.')).toBeVisible();
    await expect(page.getByLabel('Entry title')).toHaveValue('My unfinished draft');
  });

  test('clears Division B from a draft saved before it was removed', async ({ page }) => {
    await page.goto('/contribute');
    await page.evaluate(() =>
      localStorage.setItem(
        'wwr-contribute-draft-v1',
        JSON.stringify({
          fields: {
            title: 'Old draft',
            registry_section: 'Registry of Infamy - Division B',
            significance: 'Cautionary Archive',
          },
          links: [],
        })
      )
    );
    await page.reload();
    await page.waitForSelector('astro-island:not([ssr])');

    await expect(page.getByLabel('Entry title')).toHaveValue('Old draft');
    await expect(page.getByLabel('Registry section')).toHaveValue('');
    await expect(page.getByLabel('Significance')).toHaveValue('');
  });
});
