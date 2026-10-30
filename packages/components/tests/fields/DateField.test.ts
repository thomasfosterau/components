/**
 * `DateField` / `TimeField` — segmented entry on bits-ui. The group is named
 * by the FormField label (a `<label for>` cannot name a group), each
 * segment is a spinbutton named "<part>, <label>", the order follows the
 * locale, and `name` posts the ISO value.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SegmentedFieldFixture from './fixtures/SegmentedFieldFixture.svelte';

const partsOf = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('[role="spinbutton"]')].map(
    (segment) => segment.getAttribute('data-segment') ?? '',
  );

test('inside a FormField the group is named by the label and described by the hint', async () => {
  const screen = await render(SegmentedFieldFixture, { locales: 'en-AU' });

  const group = screen.getByRole('group', { name: 'Sown on' });
  await expect.element(group).toBeInTheDocument();
  await expect.element(group).toHaveAccessibleDescription('As on the seed packet.');
  await expect
    .element(screen.getByRole('spinbutton', { name: /day.*Sown on/i }))
    .toBeInTheDocument();
});

test('the locale orders the segments: en-AU day/month/year, en-US month/day/year', async () => {
  const au = await render(SegmentedFieldFixture, { locales: 'en-AU' });
  expect(partsOf(au.container)).toEqual(['day', 'month', 'year']);
  await au.unmount();

  const us = await render(SegmentedFieldFixture, { locales: 'en-US' });
  expect(partsOf(us.container)).toEqual(['month', 'day', 'year']);
});

test('typing a day advances to the month; ↑ steps; the value binds and posts as ISO', async () => {
  const screen = await render(SegmentedFieldFixture, { locales: 'en-AU' });

  const day = screen.getByRole('spinbutton', { name: /day/i });
  await day.click();
  await userEvent.keyboard('14');
  await expect.element(screen.getByRole('spinbutton', { name: /month/i })).toHaveFocus();
  await userEvent.keyboard('10');
  await userEvent.keyboard('2026');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('2026-10-14');

  await day.click();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('2026-10-15');

  await screen.getByRole('button', { name: 'Save' }).click();
  await expect.element(screen.getByTestId('posted')).toHaveTextContent('2026-10-15');
});

test('a starting value fills the segments; separators are hidden', async () => {
  const screen = await render(SegmentedFieldFixture, { locales: 'en-AU', value: '2026-03-02' });

  await expect
    .element(screen.getByRole('spinbutton', { name: /year/i }))
    .toHaveAttribute('aria-valuenow', '2026');
  for (const literal of screen.container.querySelectorAll('[data-segment="literal"]')) {
    expect(literal.getAttribute('aria-hidden')).toBe('true');
  }
});

test('in error the group is aria-invalid, drawn with input-error, and described by the error', async () => {
  const screen = await render(SegmentedFieldFixture, { invalid: true });

  const group = screen.getByRole('group', { name: 'Sown on' });
  await expect.element(group).toHaveAttribute('aria-invalid', 'true');
  await expect.element(group).toHaveClass('input-error');
  await expect.element(group).toHaveAccessibleDescription(/Pick a day\./);
});

test('TimeField: a 24-hour clock has no AM/PM segment; a 12-hour one does', async () => {
  const h24 = await render(SegmentedFieldFixture, {
    kind: 'time',
    hourCycle: 24,
    locales: 'en-AU',
  });
  expect(partsOf(h24.container)).toEqual(['hour', 'minute']);
  await expect.element(h24.getByRole('group', { name: 'Water at' })).toBeInTheDocument();
  await h24.unmount();

  const h12 = await render(SegmentedFieldFixture, {
    kind: 'time',
    hourCycle: 12,
    locales: 'en-AU',
  });
  expect(partsOf(h12.container)).toEqual(['hour', 'minute', 'dayPeriod']);
});

test('TimeField binds and posts the ISO time', async () => {
  const screen = await render(SegmentedFieldFixture, {
    kind: 'time',
    hourCycle: 24,
    locales: 'en-AU',
  });

  await screen.getByRole('spinbutton', { name: /hour/i }).click();
  await userEvent.keyboard('18');
  await userEvent.keyboard('45');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('18:45:00');
  await screen.getByRole('button', { name: 'Save' }).click();
  await expect.element(screen.getByTestId('posted')).toHaveTextContent('18:45:00');
});
