/**
 * The client-side file checks `FileInput` and `Dropzone` share.
 *
 * Pure functions, so the rules are the same wherever a file comes from —
 * the native picker or a drop, which the browser does NOT filter by
 * `accept` — and testable without a DOM.
 *
 * @module
 */

/** Why `Dropzone` refused a file. */
export interface FileRejection {
  /** The refused file. */
  readonly file: File;
  /** Which rule refused it. */
  readonly reason: 'too-large' | 'wrong-type' | 'too-many';
}

/**
 * Whether `file` satisfies an `accept` string, with the native attribute's
 * syntax: comma-separated `.ext` suffixes, `type/*` families and exact MIME
 * types, all case-insensitive. An absent or empty `accept` accepts anything.
 */
export function acceptMatches(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== '');
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/** Whether `file` is over `maxBytes`; no cap means never. */
export function exceedsSize(file: File, maxBytes: number | undefined): boolean {
  return maxBytes !== undefined && file.size > maxBytes;
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * A byte count for a file row, in the largest decimal unit that keeps the
 * number at or above 1 ("820 kB", "4.2 MB"), through `Intl.NumberFormat`'s
 * unit style.
 */
export function formatFileSize(
  bytes: number,
  locales: string | readonly string[] | undefined,
): string {
  const exponent = Math.min(
    UNITS.length - 1,
    Math.max(0, Math.floor(Math.log10(Math.max(bytes, 1)) / 3)),
  );
  const value = bytes / 1000 ** exponent;
  return new Intl.NumberFormat(
    typeof locales === 'string' || locales === undefined ? locales : [...locales],
    {
      style: 'unit',
      unit: UNITS[exponent],
      unitDisplay: 'short',
      maximumFractionDigits: exponent === 0 ? 0 : 1,
    },
  ).format(value);
}
