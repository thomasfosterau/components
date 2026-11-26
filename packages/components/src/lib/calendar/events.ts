/**
 * `EventCalendar`'s date arithmetic on `@internationalized/date`: parsing
 * events into days, the weeks of a month, the visible range, the time
 * grid's column packing and slots, and the locale's first day of the week.
 * Pure, so it is tested without a browser.
 *
 * @module
 */

import {
  type CalendarDate,
  endOfMonth,
  parseAbsolute,
  parseDate,
  parseDateTime,
  startOfMonth,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
  type ZonedDateTime,
} from '@internationalized/date';
import type { Tone } from '../ui/tones.ts';

/** One event on the calendar. Recurrences are the caller's to expand into events. */
export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  /** ISO 8601. A date alone (`2026-10-23`) is an all-day event. */
  readonly start: string;
  /** ISO 8601. For an all-day event, the last day it covers (inclusive). */
  readonly end?: string | undefined;
  /** A colour cue; never the only one, so pair it with `category`. */
  readonly tone?: Tone | undefined;
  /** What the tone means ("Sowing"), read in the event's description. */
  readonly category?: string | undefined;
  /** Open the event at this app path or `http(s):`, `mailto:` or `tel:` URL instead of calling `onEventSelect`; any other scheme is ignored. */
  readonly href?: string | undefined;
  readonly description?: string | undefined;
}

/** The calendar's views: `week` and `day` are time grids. */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/** An event resolved in a time zone. */
export interface PlacedEvent {
  readonly event: CalendarEvent;
  readonly allDay: boolean;
  /** The first and last days the event covers. */
  readonly firstDay: CalendarDate;
  readonly lastDay: CalendarDate;
  /** Start and end instants, for a timed event. */
  readonly startsAt: ZonedDateTime | undefined;
  readonly endsAt: ZonedDateTime | undefined;
}

const dateOnly = /^\d{4}-\d{2}-\d{2}$/u;
const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/u;

/**
 * An event placed in `timeZone`, or `undefined` when its dates don't parse.
 * A timed event ending exactly at midnight ends on the day before.
 */
export const placeEvent = (event: CalendarEvent, timeZone: string): PlacedEvent | undefined => {
  try {
    if (dateOnly.test(event.start)) {
      const firstDay = parseDate(event.start);
      const last = event.end === undefined ? firstDay : parseDate(event.end.slice(0, 10));
      return {
        event,
        allDay: true,
        firstDay,
        lastDay: last.compare(firstDay) < 0 ? firstDay : last,
        startsAt: undefined,
        endsAt: undefined,
      };
    }
    const startsAt = zoned(event.start, timeZone);
    const endsAt = event.end === undefined ? startsAt : zoned(event.end, timeZone);
    const firstDay = toCalendarDate(startsAt);
    const endDay = toCalendarDate(endsAt);
    const midnight = endsAt.hour === 0 && endsAt.minute === 0 && endDay.compare(firstDay) > 0;
    return {
      event,
      allDay: false,
      firstDay,
      lastDay: midnight ? endDay.subtract({ days: 1 }) : endDay,
      startsAt,
      endsAt,
    };
  } catch {
    return undefined;
  }
};

/** An ISO date-time in `timeZone`: with an offset it is that instant; without, wall time there. */
export const zoned = (iso: string, timeZone: string): ZonedDateTime =>
  hasZone.test(iso) ? parseAbsolute(iso, timeZone) : toZoned(parseDateTime(iso), timeZone);

/** Whether `placed` covers `day`. */
export const covers = (placed: PlacedEvent, day: CalendarDate): boolean =>
  placed.firstDay.compare(day) <= 0 && placed.lastDay.compare(day) >= 0;

/** The events on `day`: all-day first, then by start time, then title. */
export const eventsOn = (placed: readonly PlacedEvent[], day: CalendarDate): PlacedEvent[] =>
  placed
    .filter((each) => covers(each, day))
    .toSorted((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      const time = a.startsAt?.compare(b.startsAt ?? a.startsAt) ?? 0;
      return time === 0 ? a.event.title.localeCompare(b.event.title) : time;
    });

/** The weeks shown for the month holding `date`: whole weeks from `weekStartsOn`. */
export const monthWeeks = (date: CalendarDate, weekStartsOn: number): CalendarDate[][] => {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  let day = startOfWeekFrom(first, weekStartsOn);
  const weeks: CalendarDate[][] = [];
  while (day.compare(last) <= 0) {
    const week: CalendarDate[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(day);
      day = day.add({ days: 1 });
    }
    weeks.push(week);
  }
  return weeks;
};

/** The start of the week holding `date`, weeks beginning on `weekStartsOn` (0 Sunday … 6 Saturday). */
export const startOfWeekFrom = (date: CalendarDate, weekStartsOn: number): CalendarDate => {
  const weekday = date.toDate('UTC').getUTCDay();
  return date.subtract({ days: (weekday - weekStartsOn + 7) % 7 });
};

/** The first and last days a view shows for `date`. */
export const visibleRange = (
  view: CalendarView,
  date: CalendarDate,
  weekStartsOn: number,
): { readonly start: CalendarDate; readonly end: CalendarDate } => {
  if (view === 'agenda') return { start: startOfMonth(date), end: endOfMonth(date) };
  if (view === 'day') return { start: date, end: date };
  if (view === 'week') {
    const start = startOfWeekFrom(date, weekStartsOn);
    return { start, end: start.add({ days: 6 }) };
  }
  const weeks = monthWeeks(date, weekStartsOn);
  const start = weeks[0]?.[0] ?? startOfMonth(date);
  const end = weeks.at(-1)?.at(-1) ?? endOfMonth(date);
  return { start, end };
};

/** The days a time grid shows for `date`: its week, or the day alone. */
export const gridDays = (
  view: 'week' | 'day',
  date: CalendarDate,
  weekStartsOn: number,
): CalendarDate[] => {
  const { start, end } = visibleRange(view, date, weekStartsOn);
  const days: CalendarDate[] = [];
  for (let day = start; day.compare(end) <= 0; day = day.add({ days: 1 })) days.push(day);
  return days;
};

/** A time grid's first and last hours, `[from, to]` with `0 <= from < to <= 24`. */
export type GridHours = readonly [from: number, to: number];

/** `hours` made whole and in range; the default `[6, 22]` when they can't be. */
export const gridHours = (hours: readonly [number, number] | undefined): GridHours => {
  if (hours === undefined) return [6, 22];
  const from = Math.max(0, Math.floor(hours[0]));
  const to = Math.min(24, Math.ceil(hours[1]));
  return Number.isFinite(from) && Number.isFinite(to) && from < to ? [from, to] : [6, 22];
};

/** A half-open interval, in minutes. */
export interface Interval {
  readonly start: number;
  readonly end: number;
}

/** Where a packed interval sits: its column, the columns in its cluster, and how many it spans. */
export interface Packing {
  readonly column: number;
  readonly columns: number;
  readonly span: number;
}

const overlaps = (a: Interval, b: Interval): boolean => a.start < b.end && b.start < a.end;

/**
 * FullCalendar's column packing, for intervals sorted by start (longer
 * first on a tie). Transitively overlapping intervals form a cluster; each
 * takes the first column whose last interval has ended, the cluster is as
 * wide as its columns, and an interval spans right across columns that are
 * free for its whole length. Returns one packing per interval, in order.
 */
export const packColumns = (intervals: readonly Interval[]): Packing[] => {
  const packed: Packing[] = [];
  let cluster: { readonly index: number; readonly column: number }[] = [];
  let lanes: Interval[][] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flush = (): void => {
    const columns = lanes.length;
    for (const { index, column } of cluster) {
      const interval = intervals[index];
      const blocked =
        interval === undefined
          ? -1
          : lanes.findIndex(
              (lane, at) => at > column && lane.some((other) => overlaps(other, interval)),
            );
      packed[index] = { column, columns, span: (blocked === -1 ? columns : blocked) - column };
    }
    cluster = [];
    lanes = [];
  };

  intervals.forEach((interval, index) => {
    if (interval.start >= clusterEnd) flush();
    clusterEnd = cluster.length === 0 ? interval.end : Math.max(clusterEnd, interval.end);
    let column = lanes.findIndex((lane) => (lane.at(-1)?.end ?? 0) <= interval.start);
    if (column === -1) {
      column = lanes.length;
      lanes.push([]);
    }
    lanes[column]?.push(interval);
    cluster.push({ index, column });
  });
  flush();
  return packed;
};

/** A timed event's part of one day, in minutes from midnight, packed into columns. */
export interface TimedSegment extends Interval, Packing {
  readonly placed: PlacedEvent;
}

/**
 * The timed events on `day` as segments of the grid's `hours`: clamped to
 * them, at least `minMinutes` tall so short events stay reachable, in
 * chronological order (the DOM and tab order), and column-packed.
 */
export const timedSegments = (
  placed: readonly PlacedEvent[],
  day: CalendarDate,
  hours: GridHours,
  minMinutes = 20,
): TimedSegment[] => {
  const first = hours[0] * 60;
  const last = hours[1] * 60;
  const length = Math.min(minMinutes, last - first);
  const intervals = placed.flatMap((each) => {
    if (each.allDay || each.startsAt === undefined || each.endsAt === undefined) return [];
    if (!covers(each, day)) return [];
    const from = each.firstDay.compare(day) < 0 ? 0 : minuteOfDay(each.startsAt);
    const to = toCalendarDate(each.endsAt).compare(day) > 0 ? 24 * 60 : minuteOfDay(each.endsAt);
    const start = Math.min(Math.max(from, first), last - length);
    const end = Math.max(Math.min(Math.max(to, from), last), start + length);
    return [{ placed: each, start, end, from }];
  });
  const sorted = intervals.toSorted(
    (a, b) =>
      a.from - b.from ||
      a.start - b.start ||
      b.end - a.end ||
      a.placed.event.title.localeCompare(b.placed.event.title),
  );
  const packing = packColumns(sorted);
  return sorted.map(({ placed: each, start, end }, index) => {
    const { column = 0, columns = 1, span = 1 } = packing[index] ?? {};
    return { placed: each, start, end, column, columns, span };
  });
};

const minuteOfDay = (time: ZonedDateTime): number => time.hour * 60 + time.minute;

/** The instant `minute` minutes after midnight on `day` in `timeZone` (1440 is the next midnight). */
export const atMinute = (day: CalendarDate, minute: number, timeZone: string): ZonedDateTime =>
  toZoned(toCalendarDateTime(day).add({ minutes: minute }), timeZone);

/** ISO 8601 with the offset (`2026-10-23T09:00:00+11:00`), which `placeEvent` reads back. */
export const isoInstant = (time: ZonedDateTime): string =>
  time.toString().replace(/\[[^\]]*\]$/u, '');

/** A slot's start and end, ISO 8601 with the offset. */
export interface Slot {
  readonly start: string;
  readonly end: string;
}

/**
 * The slot a drag from minute `from` to `to` on `day` selects: either
 * direction, widened to whole `step`s, at least one step long, and inside
 * the grid's `hours`.
 */
export const slotBetween = (
  day: CalendarDate,
  from: number,
  to: number,
  hours: GridHours,
  step: number,
  timeZone: string,
): Slot => {
  const first = hours[0] * 60;
  const last = hours[1] * 60;
  const size = Math.max(1, Math.min(step, last - first));
  const low = Math.floor(Math.min(from, to) / size) * size;
  const high = Math.ceil(Math.max(from, to) / size) * size;
  const start = Math.min(Math.max(low, first), last - size);
  const end = Math.min(Math.max(high, start + size), last);
  return {
    start: isoInstant(atMinute(day, start, timeZone)),
    end: isoInstant(atMinute(day, end, timeZone)),
  };
};

/**
 * The slot a day's "New event" button offers: an hour from the next whole
 * hour when `day` is today and that is inside `hours`, otherwise from the
 * first hour; never past the last.
 */
export const defaultSlot = (
  day: CalendarDate,
  hours: GridHours,
  now: ZonedDateTime,
  timeZone: string,
): Slot => {
  const first = hours[0] * 60;
  const next = Math.ceil(minuteOfDay(now) / 60) * 60;
  const isToday = toCalendarDate(now).compare(day) === 0;
  const start = isToday && next >= first && next < hours[1] * 60 ? next : first;
  return slotBetween(day, start, start + 60, hours, 60, timeZone);
};

interface WeekInfo {
  readonly firstDay: number;
}

/** The locale's first day of the week, 0 Sunday … 6 Saturday; Monday when the platform can't say. */
export const localeWeekStart = (locale: string): number => {
  try {
    const intl = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo;
      weekInfo?: WeekInfo;
    };
    const info = intl.getWeekInfo?.() ?? intl.weekInfo;
    return info === undefined ? 1 : info.firstDay % 7;
  } catch {
    return 1;
  }
};
