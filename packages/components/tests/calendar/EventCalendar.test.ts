/**
 * `EventCalendar`'s contract: the agenda's day headings and event names
 * and descriptions, the month grid's names, `aria-current="date"`, roving
 * focus and Page keys with the heading following, Enter into a day's
 * events, "n more", the view switch and `loadRange`'s abort.
 */

import { today } from '@internationalized/date';
import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { CalendarEvent } from '../../src/lib/calendar/events.ts';
import EventCalendarFixture from './fixtures/EventCalendarFixture.svelte';

const events: CalendarEvent[] = [
  { id: 'sow', title: 'Sow tomatoes', start: '2026-10-23', href: '/tasks/sow', category: 'Sowing' },
  { id: 'water', title: 'Watering roster', start: '2026-10-23T09:00', end: '2026-10-23T10:30' },
  { id: 'harvest', title: 'Harvest garlic', start: '2026-10-28' },
];

test('agenda: a heading per day with events, each event named and described', async () => {
  const screen = await render(EventCalendarFixture, { props: { events, view: 'agenda' } });

  const headings = screen.getByRole('heading', { level: 3 }).elements();
  expect(headings.map((node) => node.textContent)).toEqual([
    'Friday 23 October',
    'Wednesday 28 October',
  ]);
  const sow = screen.getByRole('link', { name: 'Sow tomatoes' });
  await expect.element(sow).toHaveAccessibleDescription('23 October, all day. Sowing');
  await expect.element(sow).toHaveAttribute('href', '/tasks/sow');
  await expect
    .element(screen.getByRole('button', { name: 'Watering roster' }))
    .toHaveAccessibleDescription(/23 October, 9:00\s*[–-]\s*10:30\s*am/u);
});

test('month: a grid named by the heading, days named by date and count', async () => {
  const screen = await render(EventCalendarFixture, { props: { events, view: 'month' } });

  await expect.element(screen.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  const friday = screen.getByRole('gridcell', { name: 'Friday 23 October 2026, 2 events' });
  await expect.element(friday).toHaveAttribute('tabindex', '0');
  await expect.element(friday).toHaveAttribute('aria-selected', 'true');
});

test('month: today is aria-current="date"', async () => {
  const now = today('Australia/Melbourne');
  const screen = await render(EventCalendarFixture, {
    props: { view: 'month', date: now.toString() },
  });

  const current = screen
    .getByRole('gridcell')
    .elements()
    .filter((cell) => cell.getAttribute('aria-current') === 'date');
  expect(current.map((cell) => cell.getAttribute('data-date'))).toEqual([now.toString()]);
});

test('month: arrows move by day, PageDown to the next month, and the heading follows', async () => {
  const screen = await render(EventCalendarFixture, { props: { events, view: 'month' } });

  screen
    .getByRole('gridcell', { name: /Friday 23 October/u })
    .element()
    .focus();
  await userEvent.keyboard('{ArrowRight}');
  const saturday = screen.getByRole('gridcell', { name: /Saturday 24 October/u });
  await expect.element(saturday).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}{Home}');
  await expect.element(screen.getByTestId('date')).toHaveTextContent('2026-10-26');

  await userEvent.keyboard('{PageDown}');
  await expect
    .element(screen.getByRole('heading', { level: 2 }))
    .toHaveTextContent('November 2026');
  await expect
    .element(screen.getByRole('gridcell', { name: /Thursday 26 November/u }))
    .toHaveFocus();
});

test('month: Enter moves into the day’s events, Escape back out', async () => {
  const screen = await render(EventCalendarFixture, { props: { events, view: 'month' } });

  const friday = screen.getByRole('gridcell', { name: /Friday 23 October/u });
  friday.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByRole('link', { name: 'Sow tomatoes' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('button', { name: 'Watering roster' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(friday).toHaveFocus();
});

test('month: a crowded day shows “n more”, which lists them all', async () => {
  const crowded = Array.from({ length: 5 }, (_, index) => ({
    id: `job-${index}`,
    title: `Job ${index + 1}`,
    start: '2026-10-23',
  }));
  const screen = await render(EventCalendarFixture, { props: { events: crowded, view: 'month' } });

  await screen.getByRole('button', { name: '2 more' }).click();
  const dialog = screen.getByRole('dialog', { name: /Friday 23 October 2026, 5 events/u });
  expect(dialog.getByRole('button').elements()).toHaveLength(5);
});

test('the view switch changes the view, and Previous moves a month', async () => {
  const screen = await render(EventCalendarFixture, { props: { events, view: 'month' } });

  await screen.getByRole('radio', { name: 'Agenda' }).click();
  await expect.element(screen.getByRole('grid')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: 'Previous month' }).click();
  await expect
    .element(screen.getByRole('heading', { level: 2 }))
    .toHaveTextContent('September 2026');
  await expect.element(screen.getByText('No events')).toBeVisible();
});

test('loadRange is called with the visible range, and navigating aborts the last call', async () => {
  const signals: AbortSignal[] = [];
  const loadRange = vi.fn<
    (start: string, end: string, signal: AbortSignal) => Promise<readonly CalendarEvent[]>
  >(async (_start, _end, signal) => {
    signals.push(signal);
    return new Promise<readonly CalendarEvent[]>(() => undefined);
  });
  const screen = await render(EventCalendarFixture, { props: { view: 'agenda', loadRange } });

  await vi.waitFor(() =>
    expect(loadRange).toHaveBeenCalledWith('2026-10-01', '2026-10-31', signals[0]),
  );
  await screen.getByRole('button', { name: 'Next month' }).click();
  await vi.waitFor(() =>
    expect(loadRange).toHaveBeenLastCalledWith('2026-11-01', '2026-11-30', signals[1]),
  );
  expect(signals[0]?.aborted).toBe(true);
});
