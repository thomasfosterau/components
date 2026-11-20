/**
 * Columns for `TimeWheel` and `DateWheel`, built from `Intl.DateTimeFormat`
 * parts so their order, separators, hour cycle and month names follow the
 * locale, and the conversions between a wheel value and an
 * `@internationalized/date` value.
 *
 * @module
 */

import { CalendarDate, Time } from '@internationalized/date';
import type { WheelColumnDef, WheelOption, WheelValue } from './wheel.ts';

const getDaysInMonth = (date: CalendarDate): number => date.calendar.getDaysInMonth(date);

/** Column names for the time and date wheels. */
export interface WheelDateLabels {
  readonly hour: string;
  readonly minute: string;
  readonly dayPeriod: string;
  readonly day: string;
  readonly month: string;
  readonly year: string;
}

/** The English column names. */
export const defaultWheelDateLabels: WheelDateLabels = {
  hour: 'Hours',
  minute: 'Minutes',
  dayPeriod: 'AM/PM',
  day: 'Day',
  month: 'Month',
  year: 'Year',
};

/** Columns in the locale's order, with the literal text between them. */
export interface WheelLayout {
  readonly columns: readonly WheelColumnDef[];
  readonly separators: readonly string[];
}

type Part = Intl.DateTimeFormatPartTypes;

/** Orders `columns` by where their part falls in `parts`, keeping the literals between. */
const layOut = (
  parts: readonly Intl.DateTimeFormatPart[],
  columns: Partial<Record<Part, WheelColumnDef>>,
): WheelLayout => {
  const ordered: WheelColumnDef[] = [];
  const separators: string[] = [];
  let pending = '';
  for (const part of parts) {
    const column = columns[part.type];
    if (column === undefined) {
      if (part.type === 'literal') pending += part.value;
      continue;
    }
    if (ordered.length > 0) separators.push(pending.trim());
    pending = '';
    ordered.push(column);
  }
  return { columns: ordered, separators };
};

const range = (from: number, to: number, step = 1): number[] =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, index) => from + index * step);

/** Options for {@link timeWheel}. */
export interface TimeWheelOptions {
  readonly locales?: Intl.LocalesArgument | undefined;
  /** Forces a 12- or 24-hour clock; the locale's otherwise. */
  readonly hourCycle?: 12 | 24 | undefined;
  /** @defaultValue `1` */
  readonly minuteStep?: number | undefined;
  readonly labels?: WheelDateLabels | undefined;
}

/** Whether a time wheel in `locales` and `hourCycle` shows a 12-hour clock. */
export const usesTwelveHours = (
  locales: Intl.LocalesArgument,
  hourCycle: 12 | 24 | undefined,
): boolean => {
  if (hourCycle !== undefined) return hourCycle === 12;
  const cycle = new Intl.DateTimeFormat(locales, { hour: 'numeric' }).resolvedOptions().hourCycle;
  return cycle === 'h11' || cycle === 'h12';
};

/** Hour, minute and (on a 12-hour clock) AM/PM columns, in the locale's order. */
export const timeWheel = (options: TimeWheelOptions = {}): WheelLayout => {
  const { locales, hourCycle, minuteStep = 1, labels = defaultWheelDateLabels } = options;
  const twelve = usesTwelveHours(locales, hourCycle);
  const format = new Intl.DateTimeFormat(locales, {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: twelve ? 'h12' : 'h23',
    timeZone: 'UTC',
  });
  const pad = new Intl.NumberFormat(locales, { minimumIntegerDigits: 2, useGrouping: false });
  const plain = new Intl.NumberFormat(locales, { useGrouping: false });
  const hours: WheelOption[] = (twelve ? range(1, 12) : range(0, 23)).map((hour) => ({
    value: String(hour),
    label: twelve ? plain.format(hour) : pad.format(hour),
  }));
  const minutes: WheelOption[] = range(0, 59, Math.max(1, Math.floor(minuteStep))).map(
    (minute) => ({ value: String(minute), label: pad.format(minute) }),
  );
  const period = (hour: number): string =>
    format.formatToParts(Date.UTC(2026, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
      ?.value ?? (hour < 12 ? 'AM' : 'PM');
  return layOut(format.formatToParts(Date.UTC(2026, 0, 1, 13, 30)), {
    hour: { id: 'hour', label: labels.hour, options: hours, loop: true },
    minute: { id: 'minute', label: labels.minute, options: minutes, loop: true },
    ...(twelve
      ? {
          dayPeriod: {
            id: 'dayPeriod',
            label: labels.dayPeriod,
            options: [
              { value: 'am', label: period(9) },
              { value: 'pm', label: period(21) },
            ],
          },
        }
      : {}),
  });
};

/** A time as a wheel value, on a 12- or 24-hour clock; minutes round down to `minuteStep`. */
export const timeToWheel = (time: Time, twelve: boolean, minuteStep = 1): WheelValue => {
  const step = Math.max(1, Math.floor(minuteStep));
  const minute = String(time.minute - (time.minute % step));
  if (!twelve) return { hour: String(time.hour), minute };
  return {
    hour: String(time.hour % 12 === 0 ? 12 : time.hour % 12),
    minute,
    dayPeriod: time.hour < 12 ? 'am' : 'pm',
  };
};

/** A wheel value as a `Time`. */
export const wheelToTime = (value: WheelValue): Time => {
  const hour = Number(value['hour'] ?? 0);
  const minute = Number(value['minute'] ?? 0);
  const period = value['dayPeriod'];
  if (period === undefined) return new Time(hour, minute);
  return new Time((hour % 12) + (period === 'pm' ? 12 : 0), minute);
};

/** Options for {@link dateWheel}. */
export interface DateWheelOptions {
  readonly locales?: Intl.LocalesArgument | undefined;
  readonly min: CalendarDate;
  readonly max: CalendarDate;
  /** The date shown: its month and year decide how many days there are. */
  readonly date: CalendarDate;
  readonly labels?: WheelDateLabels | undefined;
}

/** Day, month and year columns in the locale's order; dates outside `min`–`max` are disabled. */
export const dateWheel = (options: DateWheelOptions): WheelLayout => {
  const { locales, min, max, date, labels = defaultWheelDateLabels } = options;
  const format = new Intl.DateTimeFormat(locales, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const monthName = new Intl.DateTimeFormat(locales, { month: 'long', timeZone: 'UTC' });
  const plain = new Intl.NumberFormat(locales, { useGrouping: false });
  const outside = (candidate: CalendarDate): boolean =>
    candidate.compare(min) < 0 || candidate.compare(max) > 0;
  const days = range(1, getDaysInMonth(date)).map((day) => ({
    value: String(day),
    label: plain.format(day),
    disabled: outside(date.set({ day })),
  }));
  const months = range(1, 12).map((month) => {
    const first = new CalendarDate(date.year, month, 1);
    const last = first.set({ day: getDaysInMonth(first) });
    return {
      value: String(month),
      label: monthName.format(Date.UTC(2026, month - 1, 1)),
      disabled: last.compare(min) < 0 || first.compare(max) > 0,
    };
  });
  const years = range(min.year, max.year).map((year) => ({
    value: String(year),
    label: plain.format(year),
  }));
  return layOut(format.formatToParts(Date.UTC(2026, 10, 20)), {
    day: { id: 'day', label: labels.day, options: days },
    month: { id: 'month', label: labels.month, options: months, loop: true },
    year: { id: 'year', label: labels.year, options: years },
  });
};

/** A date as a wheel value. */
export const dateToWheel = (date: CalendarDate): WheelValue => ({
  day: String(date.day),
  month: String(date.month),
  year: String(date.year),
});

/**
 * A wheel value as a date, the day clamped to the month (31 March → 30
 * April) and the whole kept within `min`–`max`.
 */
export const wheelToDate = (
  value: WheelValue,
  min: CalendarDate,
  max: CalendarDate,
): CalendarDate => {
  const first = new CalendarDate(Number(value['year']), Number(value['month']), 1);
  const date = first.set({ day: Math.min(Number(value['day']), getDaysInMonth(first)) });
  if (date.compare(min) < 0) return min;
  return date.compare(max) > 0 ? max : date;
};
