/**
 * The week and day time grids: the heading's range and Previous / Next by
 * week and day, the all-day strip, events named with their times in
 * chronological tab order, overlapping events all reachable, and
 * `onSlotSelect` from "New event" and from a drag.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { CalendarEvent } from '../../src/lib/calendar/events.ts';
import EventCalendarFixture from './fixtures/EventCalendarFixture.svelte';

const day: CalendarEvent[] = [
  { id: 'harvest', title: 'Harvest garlic', start: '2026-10-23', category: 'Harvest' },
  { id: 'late', title: 'Seed swap', start: '2026-10-23T14:00', end: '2026-10-23T15:00' },
  { id: 'water', title: 'Watering roster', start: '2026-10-23T09:00', end: '2026-10-23T10:30' },
  { id: 'prune', title: 'Prune roses', start: '2026-10-23T09:30', end: '2026-10-23T11:00' },
  { id: 'feed', title: 'Feed worms', start: '2026-10-23T10:00', end: '2026-10-23T10:30' },
];

test('week: the heading names the range, and Previous / Next move by a week', async () => {
  const screen = await render(EventCalendarFixture, { props: { view: 'week' } });

  const heading = screen.getByRole('heading', { level: 2 });
  await expect.element(heading).toHaveTextContent('19–25 October 2026');
  expect(screen.getByRole('heading', { level: 3 }).elements()).toHaveLength(7);
  await screen.getByRole('button', { name: 'Next week' }).click();
  await expect.element(heading).toHaveTextContent(/26 October\s*[–-]\s*1 November 2026/u);
  await screen.getByRole('button', { name: 'Previous week' }).click();
  await screen.getByRole('button', { name: 'Previous week' }).click();
  await expect.element(screen.getByTestId('date')).toHaveTextContent('2026-10-16');
});

test('day: the heading names the day, and Previous / Next move by a day', async () => {
  const screen = await render(EventCalendarFixture, { props: { view: 'day' } });

  await expect
    .element(screen.getByRole('heading', { level: 2 }))
    .toHaveTextContent('Friday 23 October 2026');
  await screen.getByRole('button', { name: 'Next day' }).click();
  await expect
    .element(screen.getByRole('heading', { level: 2 }))
    .toHaveTextContent('Saturday 24 October 2026');
});

test('day: events are named with their times, and Tab visits them in time order', async () => {
  const screen = await render(EventCalendarFixture, { props: { events: day, view: 'day' } });

  await expect
    .element(screen.getByRole('button', { name: 'Harvest garlic, all day' }))
    .toHaveAccessibleDescription('23 October, all day. Harvest');
  const water = screen.getByRole('button', {
    name: /^Watering roster, 9:00\s*[–-]\s*10:30\s*am$/u,
  });
  await expect.element(water).toBeVisible();

  water.element().focus();
  const order = [];
  for (let index = 0; index < 3; index += 1) {
    await userEvent.tab();
    order.push(document.activeElement?.getAttribute('aria-label')?.split(',')[0]);
  }
  expect(order).toEqual(['Prune roses', 'Feed worms', 'Seed swap']);
});

test('day: overlapping events sit side by side, and every one is reachable', async () => {
  const screen = await render(EventCalendarFixture, { props: { events: day, view: 'day' } });

  const names = ['Watering roster', 'Prune roses', 'Feed worms'];
  const rects = names.map((name) =>
    screen.getByRole('button', { name: new RegExp(`^${name},`, 'u') }).element(),
  );
  for (const element of rects) {
    const rect = element.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(0);
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    expect(element.contains(hit)).toBe(true);
  }
  const [first, second, third] = rects.map((element) => element.getBoundingClientRect());
  expect(first?.right).toBeLessThanOrEqual(second?.left ?? 0);
  expect(second?.right).toBeLessThanOrEqual(third?.left ?? 0);
});

test('“New event” selects an hour from the grid’s first hour', async () => {
  const onSlotSelect = vi.fn<(start: string, end: string) => void>();
  const screen = await render(EventCalendarFixture, {
    props: { view: 'day', onSlotSelect, hours: [8, 18] },
  });

  await screen.getByRole('button', { name: 'New event, Friday 23 October 2026' }).click();
  expect(onSlotSelect).toHaveBeenCalledWith(
    '2026-10-23T08:00:00+11:00',
    '2026-10-23T09:00:00+11:00',
  );
});

test('without onSlotSelect there is no “New event”', async () => {
  const screen = await render(EventCalendarFixture, { props: { view: 'week' } });

  await expect.element(screen.getByRole('heading', { level: 2 })).toBeVisible();
  expect(screen.getByRole('button', { name: /New event/u }).elements()).toHaveLength(0);
});

test('dragging over the hours selects the slot, snapped to slotMinutes', async () => {
  const onSlotSelect = vi.fn<(start: string, end: string) => void>();
  const screen = await render(EventCalendarFixture, {
    props: { view: 'day', onSlotSelect, hours: [8, 18], slotMinutes: 15 },
  });

  await expect.element(screen.getByRole('heading', { level: 2 })).toBeVisible();
  const area = screen.container.querySelector<HTMLElement>('[data-hours]');
  if (area === null) throw new Error('no hours');
  const rect = area.getBoundingClientRect();
  const at = (hour: number): number => rect.top + ((hour - 8) / 10) * rect.height;
  const pointer = (type: string, hour: number): void => {
    area.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        button: 0,
        clientX: rect.left + 10,
        clientY: at(hour),
      }),
    );
  };
  pointer('pointerdown', 9.1);
  pointer('pointermove', 10);
  pointer('pointerup', 10.4);
  expect(onSlotSelect).toHaveBeenCalledWith(
    '2026-10-23T09:00:00+11:00',
    '2026-10-23T10:30:00+11:00',
  );
});

test('loadRange gets the week', async () => {
  const loadRange = vi.fn<
    (start: string, end: string, signal: AbortSignal) => Promise<readonly CalendarEvent[]>
  >(async () => []);
  await render(EventCalendarFixture, { props: { view: 'week', loadRange } });

  await vi.waitFor(() =>
    expect(loadRange).toHaveBeenCalledWith('2026-10-19', '2026-10-25', expect.any(AbortSignal)),
  );
});
