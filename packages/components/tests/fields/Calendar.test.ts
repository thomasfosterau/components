import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CalendarFixture from './fixtures/CalendarFixture.svelte';

/** The day button for `day` in the visible month (outside-month days excluded). */
const dayButton = (container: HTMLElement, day: number): HTMLElement => {
  const match = [...container.querySelectorAll<HTMLElement>('[data-bits-day]')].find(
    (element) =>
      element.textContent?.trim() === String(day) && !element.hasAttribute('data-outside-month'),
  );
  if (match === undefined) throw new Error(`no day ${day}`);
  return match;
};

test('the month grid is named by its month, and the arrows page it', async () => {
  const screen = await render(CalendarFixture, { locales: 'en-AU' });

  await expect.element(screen.getByRole('grid', { name: /october 2026/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
  await expect.element(screen.getByRole('grid', { name: /september 2026/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
  await expect.element(screen.getByRole('grid', { name: /october 2026/i })).toBeInTheDocument();
});

test('inside FormField the calendar is labelled by the label and described by the hint', async () => {
  const screen = await render(CalendarFixture, { locales: 'en-AU' });

  const calendar = screen.getByRole('application');
  await expect.element(calendar).toHaveAccessibleName('Sown on');
  await expect.element(calendar).toHaveAccessibleDescription('Pick the day the seeds went in.');
});

test('arrow keys move between days and Enter selects, updating the bound value', async () => {
  const screen = await render(CalendarFixture, { locales: 'en-AU', value: '2026-10-23' });

  const selected = dayButton(screen.container, 23);
  await expect.element(selected).toHaveAttribute('data-selected');
  selected.focus();
  await userEvent.keyboard('{ArrowRight}{ArrowDown}');
  await expect.element(dayButton(screen.container, 31)).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('2026-10-31');
  const cell = dayButton(screen.container, 31).closest('[role="gridcell"]');
  expect(cell?.getAttribute('aria-selected')).toBe('true');
});

test('an unavailable day is marked and cannot be chosen by click or Enter', async () => {
  const screen = await render(CalendarFixture, { locales: 'en-AU', unavailable: ['2026-10-14'] });

  const day = dayButton(screen.container, 14);
  await expect.element(day).toHaveAttribute('data-unavailable');
  const cell = day.closest('[role="gridcell"]');
  expect(cell?.getAttribute('aria-disabled')).toBe('true');

  // aria-disabled, so a pointer click goes through the DOM rather than Playwright.
  day.click();
  day.focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent(/^$/);
});

test('minValue disables the days before it', async () => {
  const screen = await render(CalendarFixture, { locales: 'en-AU', minValue: '2026-10-10' });

  const early = dayButton(screen.container, 9).closest('[role="gridcell"]');
  expect(early?.getAttribute('aria-disabled')).toBe('true');
  const later = dayButton(screen.container, 10).closest('[role="gridcell"]');
  expect(later?.getAttribute('aria-disabled')).not.toBe('true');
});

test('locales="fr-FR" gives French weekday headings and a Monday start; no locales reads the context', async () => {
  const screen = await render(CalendarFixture, { locales: 'fr-FR' });

  const headings = [...screen.container.querySelectorAll('thead th')].map((cell) =>
    cell.textContent?.trim(),
  );
  expect(headings[0]?.toLowerCase()).toMatch(/^lun/);

  const fromContext = await render(CalendarFixture, { contextLocale: 'fr-FR' });
  const contextHeadings = [...fromContext.container.querySelectorAll('thead th')].map((cell) =>
    cell.textContent?.trim(),
  );
  expect(contextHeadings[0]?.toLowerCase()).toMatch(/^lun/);
});

test('two months side by side get a grid each, named apart', async () => {
  const screen = await render(CalendarFixture, { locales: 'en-AU', numberOfMonths: 2 });

  await expect.element(screen.getByRole('grid', { name: /october 2026/i })).toBeInTheDocument();
  await expect.element(screen.getByRole('grid', { name: /november 2026/i })).toBeInTheDocument();
});
