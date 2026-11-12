/**
 * `formatBytes`: a byte count as a locale-formatted size in the largest
 * sensible unit ("4.2 MB", "4,2 MB", "1.5 KiB"), for strings such as an
 * upload limit message; `ByteSize` renders the same thing as `<data>`.
 *
 * `'file'` style is SI (base 1000; kB, MB), formatted entirely by
 * `Intl.NumberFormat`'s sanctioned byte units. `'memory'` style is IEC (base
 * 1024; KiB, MiB): CLDR has no IEC units, so the number is formatted by
 * `Intl` and the unit label comes from `iecUnits` / `iecLongUnits`, English
 * by default and a prop for any other language.
 *
 * @module
 */

/** The units a size is expressed in, smallest first. */
export type ByteUnit = 'byte' | 'kilobyte' | 'megabyte' | 'gigabyte' | 'terabyte' | 'petabyte';

/** `'file'`: SI, base 1000 (kB, MB). `'memory'`: IEC, base 1024 (KiB, MiB). */
export type ByteStyle = 'file' | 'memory';

/** Plural forms of one unit label, chosen by `Intl.PluralRules`. */
export interface PluralLabel {
  readonly one: string;
  readonly other: string;
}

/** Options shared by `formatBytes` and `ByteSize`. */
export interface FormatBytesOptions {
  /** @defaultValue `'file'` */
  readonly style?: ByteStyle | undefined;
  /** @defaultValue `'short'` */
  readonly unitDisplay?: 'short' | 'narrow' | 'long' | undefined;
  /** @defaultValue `1`, or `0` for bytes and kilobytes */
  readonly maximumFractionDigits?: number | undefined;
  /** Restrict the units chosen from, e.g. `['megabyte', 'gigabyte']`. */
  readonly allowedUnits?: readonly ByteUnit[] | undefined;
  /** Short IEC labels for `'memory'` style. @defaultValue `defaultIecUnits` */
  readonly iecUnits?: Readonly<Record<ByteUnit, string>> | undefined;
  /** Long IEC labels for `'memory'` style. @defaultValue `defaultIecLongUnits` */
  readonly iecLongUnits?: Readonly<Record<ByteUnit, PluralLabel>> | undefined;
}

const UNITS: readonly ByteUnit[] = [
  'byte',
  'kilobyte',
  'megabyte',
  'gigabyte',
  'terabyte',
  'petabyte',
];

/** English short IEC labels. */
export const defaultIecUnits: Readonly<Record<ByteUnit, string>> = {
  byte: 'B',
  kilobyte: 'KiB',
  megabyte: 'MiB',
  gigabyte: 'GiB',
  terabyte: 'TiB',
  petabyte: 'PiB',
};

/** English long IEC labels. */
export const defaultIecLongUnits: Readonly<Record<ByteUnit, PluralLabel>> = {
  byte: { one: 'byte', other: 'bytes' },
  kilobyte: { one: 'kibibyte', other: 'kibibytes' },
  megabyte: { one: 'mebibyte', other: 'mebibytes' },
  gigabyte: { one: 'gibibyte', other: 'gibibytes' },
  terabyte: { one: 'tebibyte', other: 'tebibytes' },
  petabyte: { one: 'pebibyte', other: 'pebibytes' },
};

/** A size resolved to its unit, before formatting. */
export interface ScaledBytes {
  /** The size in `unit`, unrounded. */
  readonly amount: number;
  readonly unit: ByteUnit;
  /** The fraction digits it is shown with. */
  readonly fractionDigits: number;
}

const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/**
 * The largest allowed unit in which `bytes` is at least 1, promoted to the
 * next allowed unit when rounding for display would reach that unit's base
 * (999,950 bytes is "1 MB", never "1,000 kB"; 999 bytes stays "999 bytes").
 * When no allowed unit reaches 1 (500,000 bytes with only megabytes
 * allowed), the smallest allowed unit is used ("0.5 MB").
 */
export const scaleBytes = (bytes: number, options: FormatBytesOptions = {}): ScaledBytes => {
  const base = options.style === 'memory' ? 1024 : 1000;
  const allowed = UNITS.filter(
    (unit) => options.allowedUnits === undefined || options.allowedUnits.includes(unit),
  );
  const candidates = allowed.length === 0 ? UNITS : allowed;
  const magnitude = Math.abs(bytes);
  const resolve = (unit: ByteUnit): ScaledBytes => {
    const fractionDigits =
      unit === 'byte' ? 0 : (options.maximumFractionDigits ?? (unit === 'kilobyte' ? 0 : 1));
    return { amount: bytes / base ** UNITS.indexOf(unit), unit, fractionDigits };
  };
  let chosen = 0;
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    if (magnitude / base ** UNITS.indexOf(candidates[index] ?? 'byte') >= 1) {
      chosen = index;
      break;
    }
  }
  const scaled = resolve(candidates[chosen] ?? 'byte');
  const next = candidates[chosen + 1];
  const reachesNext =
    next !== undefined &&
    roundTo(Math.abs(scaled.amount), scaled.fractionDigits) >=
      base ** (UNITS.indexOf(next) - UNITS.indexOf(scaled.unit));
  return reachesNext ? resolve(next) : scaled;
};

/** The `Intl.NumberFormat` options for an SI unit at a display width. */
const siOptions = (
  scaled: ScaledBytes,
  unitDisplay: 'short' | 'narrow' | 'long',
): Intl.NumberFormatOptions => ({
  style: 'unit',
  unit: scaled.unit,
  // CLDR's short `byte` is not pluralised in English ("999 byte"), so a
  // plain byte count is written out unless the narrow "999B" was asked for.
  unitDisplay: scaled.unit === 'byte' && unitDisplay === 'short' ? 'long' : unitDisplay,
  maximumFractionDigits: scaled.fractionDigits,
});

/**
 * `bytes` in the largest sensible unit, formatted for `locales`. `NaN` and
 * infinities give `''`. Negative sizes (a delta) keep their sign.
 */
export const formatBytes = (
  bytes: number,
  options: FormatBytesOptions = {},
  locales?: Intl.LocalesArgument,
): string => {
  if (!Number.isFinite(bytes)) return '';
  const scaled = scaleBytes(bytes, options);
  const unitDisplay = options.unitDisplay ?? 'short';
  if (options.style !== 'memory') {
    return new Intl.NumberFormat(locales, siOptions(scaled, unitDisplay)).format(scaled.amount);
  }
  const number = new Intl.NumberFormat(locales, {
    maximumFractionDigits: scaled.fractionDigits,
  });
  const rounded = roundTo(scaled.amount, scaled.fractionDigits);
  if (unitDisplay === 'long') {
    const labels = (options.iecLongUnits ?? defaultIecLongUnits)[scaled.unit];
    const plural = new Intl.PluralRules(locales).select(rounded);
    return `${number.format(scaled.amount)} ${plural === 'one' ? labels.one : labels.other}`;
  }
  const label = (options.iecUnits ?? defaultIecUnits)[scaled.unit];
  return `${number.format(scaled.amount)}${unitDisplay === 'narrow' ? '' : ' '}${label}`;
};

/** The exact count in bytes, written out: "4,200,000 bytes". */
export const formatExactBytes = (bytes: number, locales?: Intl.LocalesArgument): string =>
  Number.isFinite(bytes)
    ? new Intl.NumberFormat(locales, { style: 'unit', unit: 'byte', unitDisplay: 'long' }).format(
        bytes,
      )
    : '';
