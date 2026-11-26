import { parseDate, parseZonedDateTime } from '@internationalized/date';
import { describe, expect, test } from 'vite-plus/test';
import {
  defaultSlot,
  eventsOn,
  gridDays,
  gridHours,
  localeWeekStart,
  monthWeeks,
  packColumns,
  placeEvent,
  slotBetween,
  startOfWeekFrom,
  timedSegments,
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

  test('the week view shows its week; the day view the day', () => {
    const day = parseDate('2026-10-23');
    const week = visibleRange('week', day, 1);
    expect([week.start.toString(), week.end.toString()]).toEqual(['2026-10-19', '2026-10-25']);
    expect(visibleRange('day', day, 1).end.toString()).toBe('2026-10-23');
    expect(gridDays('week', day, 0).map(String)).toHaveLength(7);
    expect(gridDays('day', day, 0).map(String)).toEqual(['2026-10-23']);
  });

  test('the locale’s first day of the week', () => {
    expect(localeWeekStart('en-US')).toBe(0);
    expect(localeWeekStart('en-AU')).toBe(1);
  });
});

const pack = (...pairs: [number, number][]) =>
  packColumns(pairs.map(([start, end]) => ({ start, end })));

describe('packColumns', () => {
  test('apart, each has the full width', () => {
    expect(pack([0, 60], [60, 120])).toEqual([
      { column: 0, columns: 1, span: 1 },
      { column: 0, columns: 1, span: 1 },
    ]);
  });

  test('overlapping intervals take side-by-side columns', () => {
    expect(pack([0, 60], [30, 90], [45, 75]).map((each) => each.column)).toEqual([0, 1, 2]);
  });

  test('a freed column is reused, and the cluster is as wide as its columns', () => {
    // 0–120 holds column 0; 0–30 and 30–60 share column 1.
    expect(pack([0, 120], [0, 30], [30, 60])).toEqual([
      { column: 0, columns: 2, span: 1 },
      { column: 1, columns: 2, span: 1 },
      { column: 1, columns: 2, span: 1 },
    ]);
  });

  test('an interval spans right across columns free for its length', () => {
    // Three columns at 0–30; 60–90 joins the cluster through 0–120 and can span columns 1 and 2.
    const packed = pack([0, 120], [0, 30], [0, 30], [60, 90]);
    expect(packed[3]).toEqual({ column: 1, columns: 3, span: 2 });
  });

  test('a new cluster starts once every interval has ended', () => {
    expect(pack([0, 60], [30, 90], [90, 120])[2]).toEqual({ column: 0, columns: 1, span: 1 });
  });
});

describe('timedSegments', () => {
  const day = parseDate('2026-10-23');

  test('chronological, packed, and without all-day events', () => {
    const segments = timedSegments(
      [
        place('2026-10-23T10:00', '2026-10-23T11:00'),
        place('2026-10-23'),
        place('2026-10-23T09:00', '2026-10-23T10:30'),
      ],
      day,
      [6, 22],
    );
    expect(segments.map((each) => [each.start, each.end, each.column, each.columns])).toEqual([
      [540, 630, 0, 2],
      [600, 660, 1, 2],
    ]);
  });

  test('clamped to the hours, and never shorter than the minimum', () => {
    const [early, brief, late] = timedSegments(
      [
        place('2026-10-23T04:00', '2026-10-23T07:00'),
        place('2026-10-23T21:30', '2026-10-23T23:00'),
        place('2026-10-23T12:00'),
      ],
      day,
      [6, 22],
    );
    expect([early?.start, early?.end]).toEqual([360, 420]);
    expect([brief?.start, brief?.end]).toEqual([720, 740]);
    expect([late?.start, late?.end]).toEqual([1290, 1320]);
  });

  test('an event across midnight is cut at each day’s edge', () => {
    const overnight = place('2026-10-23T20:00', '2026-10-24T02:00');
    expect(timedSegments([overnight], day, [0, 24])[0]).toMatchObject({ start: 1200, end: 1440 });
    expect(timedSegments([overnight], day.add({ days: 1 }), [0, 24])[0]).toMatchObject({
      start: 0,
      end: 120,
    });
  });
});

describe('slots', () => {
  const day = parseDate('2026-10-23');
  const zone = 'Australia/Melbourne';

  test('a drag widens to whole steps in either direction, with the offset', () => {
    expect(slotBetween(day, 620, 545, [6, 22], 30, zone)).toEqual({
      start: '2026-10-23T09:00:00+11:00',
      end: '2026-10-23T10:30:00+11:00',
    });
  });

  test('a click is one step, kept inside the hours', () => {
    expect(slotBetween(day, 600, 600, [6, 22], 30, zone).end).toBe('2026-10-23T10:30:00+11:00');
    expect(slotBetween(day, 1330, 1330, [6, 22], 30, zone)).toEqual({
      start: '2026-10-23T21:30:00+11:00',
      end: '2026-10-23T22:00:00+11:00',
    });
  });

  test('an hour from the next whole hour today, else from the first hour', () => {
    const now = parseZonedDateTime('2026-10-23T09:20[Australia/Melbourne]');
    expect(defaultSlot(day, [6, 22], now, zone)).toEqual({
      start: '2026-10-23T10:00:00+11:00',
      end: '2026-10-23T11:00:00+11:00',
    });
    expect(defaultSlot(day.add({ days: 1 }), [6, 22], now, zone).start).toBe(
      '2026-10-24T06:00:00+11:00',
    );
  });

  test('a slot reads back as the same instant', () => {
    const { start } = slotBetween(day, 540, 600, [6, 22], 30, zone);
    expect(place(start).startsAt?.hour).toBe(9);
  });

  test('hours out of range fall back to the default', () => {
    expect(gridHours([8, 18])).toEqual([8, 18]);
    expect(gridHours([-2, 30])).toEqual([0, 24]);
    expect(gridHours([20, 8])).toEqual([6, 22]);
  });
});
