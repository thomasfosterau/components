import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CalendarFixture from './fixtures/CalendarFixture.svelte';

const dayButton = (container: HTMLElement, day: number): HTMLElement => {
  const match = [...container.querySelectorAll<HTMLElement>('[data-bits-day]')].find(
    (element) =>
      element.textContent?.trim() === String(day) && !element.hasAttribute('data-outside-month'),
  );
  if (match === undefined) throw new Error(`no day ${day}`);
  return match;
};

test('two clicks set the start and the end, and the days between are the range middle', async () => {
  const screen = await render(CalendarFixture, { range: true, locales: 'en-AU' });

  await userEvent.click(dayButton(screen.container, 5));
  await userEvent.click(dayButton(screen.container, 9));

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('2026-10-05..2026-10-09');
  await expect.element(dayButton(screen.container, 7)).toHaveAttribute('data-range-middle');
  await expect.element(dayButton(screen.container, 5)).toHaveAttribute('data-range-start');
  await expect.element(dayButton(screen.container, 9)).toHaveAttribute('data-range-end');
});

test('minDays refuses a range that is too short', async () => {
  const screen = await render(CalendarFixture, { range: true, locales: 'en-AU', minDays: 4 });

  await userEvent.click(dayButton(screen.container, 5));
  // Too-short ends are disabled once a start is chosen, so click through the DOM.
  dayButton(screen.container, 6).click();
  await expect.element(screen.getByTestId('bound')).not.toHaveTextContent('2026-10-05..2026-10-06');

  const longer = await render(CalendarFixture, { range: true, locales: 'en-AU', minDays: 4 });
  await userEvent.click(dayButton(longer.container, 5));
  await userEvent.click(dayButton(longer.container, 12));
  await expect
    .poll(() => longer.container.querySelector('[data-testid="bound"]')?.textContent?.trim())
    .toBe('2026-10-05..2026-10-12');
});

test('inside FormField the range calendar is labelled by the label', async () => {
  const screen = await render(CalendarFixture, { range: true, locales: 'en-AU' });

  await expect.element(screen.getByRole('application')).toHaveAccessibleName('Sown on');
});
