/**
 * Locale-aware number formatting and parsing for `NumberField`.
 *
 * Formatting is `Intl.NumberFormat`. Parsing is the inverse the platform does
 * not ship: the locale's group and decimal separators, and any literal text
 * the options add (a unit, a currency symbol, a percent sign), are learnt
 * from `formatToParts` on a sample number, so "1.234,5 cm" in `de-DE` and
 * "1,234.5 cm" in `en-AU` both read back as `1234.5`.
 *
 * Only ASCII digits are parsed. A locale whose formatter writes other digits
 * (Arabic-Indic, Devanagari) formats correctly but does not read its own
 * output back; widening the parser is a later decision (#145).
 *
 * Pure functions, no module-level state, so the file stays tree-shakeable.
 *
 * @module
 */

/** The locales argument every function here accepts, as `Intl.NumberFormat` does. */
export type NumberLocales = string | readonly string[] | undefined;

/** What a locale and a set of options write around the digits. */
export interface NumberSymbols {
  /** The grouping separator, e.g. `','` in `en-AU`, `'.'` in `de-DE`, a narrow no-break space in `fr-FR`. */
  readonly group: string;
  /** The decimal separator. */
  readonly decimal: string;
  /** Every other non-digit string the format adds: unit, currency, percent sign, literal spacing. */
  readonly literals: readonly string[];
}

/** One formatter per call site; `Intl.NumberFormat` wants a mutable array. */
function formatter(locales: NumberLocales, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(
    typeof locales === 'string' || locales === undefined ? locales : [...locales],
    options,
  );
}

/** Learn the separators and literal text a locale and options produce. */
export function numberSymbols(
  locales: NumberLocales,
  options?: Intl.NumberFormatOptions,
): NumberSymbols {
  const parts = formatter(locales, { ...options, useGrouping: true }).formatToParts(-12345.6);
  const of = (type: Intl.NumberFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  const literals = parts
    .filter((part) =>
      ['literal', 'unit', 'currency', 'percentSign', 'plusSign'].includes(part.type),
    )
    .map((part) => part.value.trim())
    .filter((value) => value !== '');
  return { group: of('group'), decimal: of('decimal') || '.', literals };
}

/** Format `value` for display; `''` for `undefined`. */
export function formatNumber(
  value: number | undefined,
  locales: NumberLocales,
  options?: Intl.NumberFormatOptions,
): string {
  return value === undefined ? '' : formatter(locales, options).format(value);
}

/** Spaces a locale may group with, all read as the same separator. */
const SPACES = /[\s  ]/g;

/**
 * Parse text written in `locales` with `options` back into a number.
 *
 * Returns `undefined` for empty (or whitespace-only) text and `NaN` for text
 * that is not a number, so a caller can tell "cleared" from "garbage".
 * Percent-style input is divided by 100, the inverse of the formatter.
 */
export function parseNumber(
  text: string,
  locales: NumberLocales,
  options?: Intl.NumberFormatOptions,
): number | undefined {
  if (text.trim() === '') return undefined;
  const { group, decimal, literals } = numberSymbols(locales, options);
  let rest = text;
  // Longest first, so "US$" is removed before "$".
  for (const literal of [...literals].sort((a, b) => b.length - a.length)) {
    rest = rest.split(literal).join('');
  }
  if (group.trim() === '') rest = rest.replace(SPACES, '');
  else rest = rest.split(group).join('').replace(SPACES, '');
  rest = rest
    .split(decimal)
    .join('.')
    .replace(/[−‒–]/g, '-');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(rest)) return Number.NaN;
  const parsed = Number(rest);
  return options?.style === 'percent' ? roundTo(parsed / 100, 15) : parsed;
}

/** Number of decimal places in `n` as written, e.g. 2 for `0.25`, 0 for `5`. */
export function decimalPlaces(n: number): number {
  const [, fraction = ''] = String(n).split('.');
  const exponent = /e-(\d+)$/.exec(String(n));
  return exponent === null ? fraction.length : Number(exponent[1]) + fraction.length;
}

/** Round `n` to `places` decimal places without binary drift (`0.1 + 0.2` → `0.3`). */
export function roundTo(n: number, places: number): number {
  return Number(n.toFixed(Math.min(100, Math.max(0, places))));
}

/**
 * The decimal places a committed value keeps: the more of the step's and the
 * formatter's own (a percent shows two more places of the fraction than it
 * displays), so a value is never rounded finer than the reader can see.
 */
export function valuePrecision(
  step: number,
  locales: NumberLocales,
  options?: Intl.NumberFormatOptions,
): number {
  const shown = formatter(locales, options).resolvedOptions().maximumFractionDigits ?? 0;
  return Math.max(decimalPlaces(step), shown + (options?.style === 'percent' ? 2 : 0));
}

/** Clamp `n` into `[min, max]`; either bound may be absent. */
export function clamp(n: number, min: number | undefined, max: number | undefined): number {
  return Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n));
}
