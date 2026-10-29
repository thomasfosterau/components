/**
 * Lengths of time: the value type, its ISO 8601 form for `<time datetime>`,
 * and a locale-aware formatter that `Duration` and `Countdown` share and an
 * app can call in plain TypeScript.
 *
 * `formatDuration` uses `Intl.DurationFormat` where the runtime has it
 * (Baseline 2025) and otherwise composes per-unit `Intl.NumberFormat` unit
 * strings with an `Intl.ListFormat` of `type: 'unit'`, so the fallback is
 * still localised, just less idiomatic.
 *
 * @module
 */

/** A length of time; any subset of fields. Mirrors `Intl.DurationFormat`'s input. */
export interface DurationValue {
  readonly years?: number | undefined;
  readonly months?: number | undefined;
  readonly weeks?: number | undefined;
  readonly days?: number | undefined;
  readonly hours?: number | undefined;
  readonly minutes?: number | undefined;
  readonly seconds?: number | undefined;
  readonly milliseconds?: number | undefined;
}

/** How a duration is spelled: `'2 hours, 30 minutes'`, `'2 hr, 30 min'`, `'2h 30m'` or `'2:30:00'`. */
export type DurationStyle = 'long' | 'short' | 'narrow' | 'digital';

type Field = keyof DurationValue;

/** The fields, largest first, with the `Intl` unit each formats as. */
const FIELDS: readonly { readonly field: Field; readonly unit: string }[] = [
  { field: 'years', unit: 'year' },
  { field: 'months', unit: 'month' },
  { field: 'weeks', unit: 'week' },
  { field: 'days', unit: 'day' },
  { field: 'hours', unit: 'hour' },
  { field: 'minutes', unit: 'minute' },
  { field: 'seconds', unit: 'second' },
  { field: 'milliseconds', unit: 'millisecond' },
];

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Split milliseconds into days, hours, minutes, seconds and milliseconds,
 * leaving out the zero fields (`9_309_000` → `{ hours: 2, minutes: 35,
 * seconds: 9 }`). Days are the largest unit: months and years have no fixed
 * length. Negative input is treated as zero.
 */
export function durationFromMilliseconds(ms: number): DurationValue {
  let rest = Math.max(0, Math.round(ms));
  const parts: Record<string, number> = {};
  for (const [field, size] of [
    ['days', DAY],
    ['hours', HOUR],
    ['minutes', MINUTE],
    ['seconds', SECOND],
    ['milliseconds', 1],
  ] as const) {
    const count = Math.floor(rest / size);
    rest -= count * size;
    if (count > 0) parts[field] = count;
  }
  return parts;
}

/**
 * The ISO 8601 duration string for `<time datetime>`: `{ hours: 2,
 * minutes: 30 }` → `'PT2H30M'`. Milliseconds join the seconds as a
 * fraction; an empty duration is `'PT0S'`.
 */
export function toIsoDuration(value: DurationValue): string {
  const amount = (field: Field): number => value[field] ?? 0;
  const date = [
    amount('years') > 0 ? `${amount('years')}Y` : '',
    amount('months') > 0 ? `${amount('months')}M` : '',
    amount('weeks') > 0 ? `${amount('weeks')}W` : '',
    amount('days') > 0 ? `${amount('days')}D` : '',
  ].join('');
  const seconds = amount('seconds') + amount('milliseconds') / 1000;
  const time = [
    amount('hours') > 0 ? `${amount('hours')}H` : '',
    amount('minutes') > 0 ? `${amount('minutes')}M` : '',
    seconds > 0 ? `${Number(seconds.toFixed(3))}S` : '',
  ].join('');
  if (date === '' && time === '') return 'PT0S';
  return `P${date}${time === '' ? '' : `T${time}`}`;
}

interface DurationFormatConstructor {
  new (
    locales?: string | readonly string[],
    options?: { style?: DurationStyle },
  ): { format(value: DurationValue): string };
}

/** `Intl.DurationFormat` when the runtime has it. */
function nativeDurationFormat(): DurationFormatConstructor | undefined {
  const intl = Intl as unknown as { DurationFormat?: DurationFormatConstructor };
  return intl.DurationFormat;
}

/** `value` with the `undefined` and zero fields dropped, as `Intl.DurationFormat` wants. */
function presentFields(value: DurationValue): DurationValue {
  return Object.fromEntries(
    FIELDS.filter(({ field }) => (value[field] ?? 0) !== 0).map(({ field }) => [
      field,
      value[field],
    ]),
  );
}

/** `H:MM:SS` from the hours, minutes and seconds, the larger units folded into hours. */
function digital(value: DurationValue): string {
  const hours = (value.days ?? 0) * 24 + (value.hours ?? 0);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${hours}:${pad(value.minutes ?? 0)}:${pad(value.seconds ?? 0)}`;
}

/**
 * Format a duration for `locales` in `style`, through `Intl.DurationFormat`
 * where available and a localised `NumberFormat` + `ListFormat` composition
 * otherwise.
 */
export function formatDuration(
  value: DurationValue,
  locales?: string | readonly string[] | undefined,
  style: DurationStyle = 'short',
): string {
  const present = presentFields(value);
  const Native = nativeDurationFormat();
  if (Native !== undefined) {
    return new Native(locales, { style }).format(present);
  }
  if (style === 'digital') return digital(value);
  const unitDisplay = style;
  const pieces = FIELDS.filter(({ field }) => present[field] !== undefined).map(({ field, unit }) =>
    new Intl.NumberFormat(locales as string | string[] | undefined, {
      style: 'unit',
      unit,
      unitDisplay,
    }).format(present[field] ?? 0),
  );
  return new Intl.ListFormat(locales as string | string[] | undefined, {
    type: 'unit',
    style: style === 'long' ? 'long' : style === 'short' ? 'short' : 'narrow',
  }).format(
    pieces.length === 0
      ? [
          new Intl.NumberFormat(locales as string | string[] | undefined, {
            style: 'unit',
            unit: 'second',
            unitDisplay,
          }).format(0),
        ]
      : pieces,
  );
}
