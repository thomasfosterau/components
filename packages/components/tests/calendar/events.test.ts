import { parseDate } from '@internationalized/date';
import { describe, expect, test } from 'vite-plus/test';
import {
  eventsOn,
  localeWeekStart,
  monthWeeks,
  placeEvent,
  startOfWeekFrom,
  visibleRange,
  type PlacedEvent,
} from '../../src/lib/calendar/events.ts';

const place = (start: string, end?: string): PlacedEvent => {
  const placed = placeEvent({ id: start, title: start, start, end }, 'Australia/Melbourne');
  if (placed === undefined) throw new Error('unparsed');
  return placed;
};

describe('placeEvent', () => {
  test('a date alone is all day, through its inclusive end', () => {
    const placed = place('2026-10-23', '2026-10-25');
    expect(placed.allDay).toBe(true);
    expect(placed.firstDay.toString()).toBe('2026-10-23');
    expect(placed.lastDay.toString()).toBe('2026-10-25');
  });

  test('a wall time is in the calendar’s zone; an instant is moved into it', () => {
    expect(place('2026-10-23T09:00').startsAt?.hour).toBe(9);
    const utc = place('2026-10-23T22:00Z');
    expect(utc.firstDay.toString()).toBe('2026-10-24');
    expect(utc.startsAt?.hour).toBe(9);
  });

  test('a timed event ending at midnight ends the day before', () => {
    expect(place('2026-10-23T20:00', '2026-10-24T00:00').lastDay.toString()).toBe('2026-10-23');
  });

  test('unparseable dates are skipped', () => {
    expect(placeEvent({ id: 'x', title: 'x', start: 'soon' }, 'UTC')).toBeUndefined();
  });
});

test('eventsOn orders all-day first, then by time', () => {
  const day = parseDate('2026-10-23');
  const placed = [place('2026-10-23T14:00'), place('2026-10-23'), place('2026-10-23T09:00')];
  expect(eventsOn(placed, day).map((each) => each.event.start)).toEqual([
    '2026-10-23',
    '2026-10-23T09:00',
    '2026-10-23T14:00',
  ]);
});

describe('weeks', () => {
  test('a week starts on the day asked for', () => {
    const friday = parseDate('2026-10-23');
    expect(startOfWeekFrom(friday, 1).toString()).toBe('2026-10-19');
    expect(startOfWeekFrom(friday, 0).toString()).toBe('2026-10-18');
    expect(startOfWeekFrom(friday, 6).toString()).toBe('2026-10-17');
  });

  test('a month is whole weeks covering it', () => {
    const weeks = monthWeeks(parseDate('2026-10-23'), 1);
    expect(weeks[0]?.[0]?.toString()).toBe('2026-09-28');
    expect(weeks.at(-1)?.at(-1)?.toString()).toBe('2026-11-01');
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  test('the agenda shows the month; the month view its whole weeks', () => {
    const day = parseDate('2026-10-23');
    expect(visibleRange('agenda', day, 1).start.toString()).toBe('2026-10-01');
    expect(visibleRange('month', day, 1).start.toString()).toBe('2026-09-28');
  });

  test('the locale’s first day of the week', () => {
    expect(localeWeekStart('en-US')).toBe(0);
    expect(localeWeekStart('en-AU')).toBe(1);
  });
});
