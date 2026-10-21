import type { Channel, Datum } from '../../spec/index.ts';
import { makeAccessor } from '../accessor.ts';
import type { DataRows, ResolvedScale } from '../types.ts';

/** A group of data rows sharing a colour-channel category. */
export interface SeriesGroup {
  readonly key: string | null;
  readonly color: string | undefined;
  readonly rows: DataRows;
}

/**
 * Splits data rows into series by the colour channel, preserving data order.
 * Without a colour channel, returns a single unsplit series.
 */
export function splitSeries(
  data: DataRows,
  colorChannel: Channel | undefined,
  colorScale: ResolvedScale | undefined,
): SeriesGroup[] {
  if (!colorChannel || !colorScale) {
    return [{ key: null, color: undefined, rows: data }];
  }

  const accessor = makeAccessor(colorChannel);
  const groups = new Map<string, Datum[]>();
  for (const datum of data) {
    const value = accessor(datum);
    if (value === null) continue;
    const key = typeof value === 'string' ? value : String(value);
    const group = groups.get(key);
    if (group) {
      group.push(datum);
    } else {
      groups.set(key, [datum]);
    }
  }

  return [...groups.entries()].map(([key, rows]) => ({
    key,
    color: colorOf(colorScale, key),
    rows,
  }));
}

/** Resolves a colour for a single datum, or undefined without a colour encoding. */
export function colorOfDatum(
  datum: Datum,
  colorChannel: Channel | undefined,
  colorScale: ResolvedScale | undefined,
): string | undefined {
  if (!colorChannel || !colorScale) return undefined;
  const value = makeAccessor(colorChannel)(datum);
  if (value === null) return undefined;
  return colorOf(colorScale, value);
}

function colorOf(scale: ResolvedScale, value: number | string | Date): string | undefined {
  const result = scale.apply(value);
  return typeof result === 'string' ? result : undefined;
}
