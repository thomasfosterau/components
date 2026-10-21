import type { Channel, Datum, DatumValue } from '../spec/index.ts';

/**
 * A typed field value reconstructed from a datum according to the channel's
 * declared encoding type. `null` means "missing": the datum is skipped by
 * geometry builders.
 */
export type FieldValue = number | Date | string | null;

/**
 * Creates a typed accessor for an encoding channel.
 *
 * Values are reconstructed from the channel's **declared** type — never by
 * sniffing the runtime shape of the JSON value (the cross-platform invariant
 * every interpreter must follow):
 *
 * - `quantitative` → finite number
 * - `temporal` → Date, parsed from ISO 8601 strings or epoch milliseconds
 * - `ordinal` / `nominal` → category string (numbers/booleans are stringified)
 *
 * Missing fields and nulls yield `null`. Values that contradict the declared
 * type throw: a declared type is a contract, and violating it is a data error
 * the caller must surface, not hide.
 */
export function makeAccessor(channel: Channel): (datum: Datum) => FieldValue {
  switch (channel.type) {
    case 'quantitative':
      return (datum) => toQuantitative(datum[channel.field], channel.field);
    case 'temporal':
      return (datum) => toTemporal(datum[channel.field], channel.field);
    case 'ordinal':
    case 'nominal':
      return (datum) => toCategory(datum[channel.field]);
  }
}

function toQuantitative(value: DatumValue | undefined, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new TypeError(
    `Field "${field}" is declared quantitative but datum value ${JSON.stringify(value)} is not a finite number`,
  );
}

function toTemporal(value: DatumValue | undefined, field: string): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  throw new TypeError(
    `Field "${field}" is declared temporal but datum value ${JSON.stringify(value)} is not a parseable date (expected ISO 8601 string or epoch milliseconds)`,
  );
}

function toCategory(value: DatumValue | undefined): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : String(value);
}
