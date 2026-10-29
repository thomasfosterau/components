/**
 * Small helpers `Calendar` and `RangeCalendar` share when handing their props
 * to bits-ui.
 *
 * @module
 */

import type { DateValue } from '@internationalized/date';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** bits-ui's calendars take ONE locale string; ours takes `Intl`'s list. The first entry wins. */
export function firstLocale(locales: string | readonly string[] | undefined): string | undefined {
  return typeof locales === 'string' ? locales : locales?.[0];
}

/**
 * Drop the `undefined` entries of an options object. The workspace compiles
 * with `exactOptionalPropertyTypes`, and bits-ui declares its optional props
 * as bare `?: T`, so an option this library leaves unset must be absent, not
 * `undefined`, when it is spread onto a bits-ui root.
 */
export function definedProps<T extends Record<string, unknown>>(
  options: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

/**
 * The props `Calendar` and `RangeCalendar` share — everything but the value.
 * Each maps onto the bits-ui root prop of the same name, except `locales`
 * (bits-ui takes one locale; the first entry is used) and the `FieldControl`
 * members.
 */
export interface CalendarBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'placeholder' | 'children' | 'id'
> {
  /**
   * A date in the month to show (bits-ui's `placeholder`); omitted, the
   * selected date's month, else today's. Bindable: it follows paging.
   */
  month?: DateValue | undefined;
  /** Earliest selectable date. */
  minValue?: DateValue | undefined;
  /** Latest selectable date. */
  maxValue?: DateValue | undefined;
  /** Days that cannot be chosen at all; rendered disabled. */
  isDateDisabled?: ((date: DateValue) => boolean) | undefined;
  /** Days shown but marked unavailable — booked, frost, closed. */
  isDateUnavailable?: ((date: DateValue) => boolean) | undefined;
  /**
   * Months shown side by side.
   * @defaultValue `1`
   */
  numberOfMonths?: number | undefined;
  /** 0 = Sunday … 6 = Saturday; omitted, the locale's own week start. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  /**
   * Always render six weeks, so the grid never changes height.
   * @defaultValue `false`
   */
  fixedWeeks?: boolean | undefined;
  /** BCP 47 locale(s); the first is used. Falls back to the context's `locale()`. */
  locales?: string | readonly string[] | undefined;
  /**
   * Accessible name of the calendar, before the visible month.
   * @defaultValue `'Calendar'`
   */
  calendarLabel?: string | undefined;
  /**
   * Accessible name of the previous-month button.
   * @defaultValue `'Previous month'`
   */
  previousLabel?: string | undefined;
  /**
   * Accessible name of the next-month button.
   * @defaultValue `'Next month'`
   */
  nextLabel?: string | undefined;
  /**
   * No interaction at all.
   * @defaultValue `false`
   */
  disabled?: boolean | undefined;
  /**
   * Navigable, but the value cannot change.
   * @defaultValue `false`
   */
  readonly?: boolean | undefined;
  /** Extra decoration in a day cell (a dot for "something planted"). */
  day?: Snippet<[{ date: DateValue; selected: boolean; unavailable: boolean }]> | undefined;
  /** `FieldControl`: the root's `id`. */
  id?: string | undefined;
  /** `FieldControl`: the visible label's id; the calendar is `aria-labelledby` it. */
  labelId?: string | undefined;
  /**
   * `FieldControl`: space-separated ids for `aria-describedby`.
   * @defaultValue `''`
   */
  describedBy?: string | undefined;
  /**
   * `FieldControl`: the field is in error — draws the error border.
   * @defaultValue `false`
   */
  invalid?: boolean | undefined;
  /** `FieldControl`: accepted for the spread; a calendar has no empty-value validation of its own. */
  required?: boolean | undefined;
}

/** What `calendarRoot` hands `CalendarMonths`. */
export interface CalendarMonthsOptions {
  readonly locale: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly day: CalendarBaseProps['day'];
}

/**
 * Turn the shared props into what both bits-ui roots and `CalendarMonths`
 * take: the defaults applied, the unset options dropped, the `FieldControl`
 * members mapped onto ARIA, and every other attribute passed through. One
 * function, so `Calendar` and `RangeCalendar` cannot disagree about a default.
 */
export function calendarRoot(
  props: Omit<CalendarBaseProps, 'month'>,
  contextLocale: string | readonly string[] | undefined,
): { readonly root: Record<string, unknown>; readonly months: CalendarMonthsOptions } {
  const {
    minValue,
    maxValue,
    isDateDisabled,
    isDateUnavailable,
    numberOfMonths = 1,
    weekStartsOn,
    fixedWeeks = false,
    locales = contextLocale,
    calendarLabel = 'Calendar',
    previousLabel = 'Previous month',
    nextLabel = 'Next month',
    disabled = false,
    readonly = false,
    day,
    id,
    labelId,
    describedBy = '',
    invalid = false,
    required: _required,
    class: className,
    ...rest
  } = props;
  const locale = firstLocale(locales) ?? 'en';
  return {
    root: {
      ...rest,
      ...definedProps({ id, minValue, maxValue, isDateDisabled, isDateUnavailable, weekStartsOn }),
      numberOfMonths,
      weekdayFormat: 'short',
      fixedWeeks,
      locale,
      calendarLabel,
      disabled,
      readonly,
      'aria-labelledby': labelId,
      'aria-describedby': describedBy === '' ? undefined : describedBy,
      class: [
        'card card-border bg-base-100 inline-block p-3',
        invalid && 'border-error',
        disabled && 'opacity-50',
        className,
      ],
    },
    months: { locale, previousLabel, nextLabel, day },
  };
}
