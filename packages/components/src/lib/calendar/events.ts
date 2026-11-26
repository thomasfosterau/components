/**
 * `EventCalendar`'s date arithmetic on `@internationalized/date`: parsing
 * events into days, the weeks of a month, the visible range, and the
 * locale's first day of the week. Pure, so it is tested without a browser.
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

/** The calendar's views. Week and day time grids are not built yet. */
export type CalendarView = 'month' | 'agenda';

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
  const weeks = monthWeeks(date, weekStartsOn);
  const start = weeks[0]?.[0] ?? startOfMonth(date);
  const end = weeks.at(-1)?.at(-1) ?? endOfMonth(date);
  return { start, end };
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
