import type { Channel, Mark, ScaleHint } from '../spec/index.ts';
import {
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  scalePoint,
  scaleSqrt,
  scaleUtc,
  type ScaleBand,
  type ScaleLinear,
  type ScalePoint,
  type ScaleTime,
} from 'd3-scale';
import { makeAccessor, type FieldValue } from './accessor.ts';
import type { DataRows, DomainValue, ResolvedScale } from './types.ts';

/**
 * Default categorical palette (Tableau 10). Interpreters may override; the
 * core resolves concrete colours so geometry is directly drawable.
 */
export const CATEGORICAL_PALETTE: ReadonlyArray<string> = [
  '#4e79a7',
  '#f28e2c',
  '#e15759',
  '#76b7b4',
  '#59a14f',
  '#edc949',
  '#af7aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ab',
];

/** Default radius range (pixels) for the size channel on point marks. */
export const DEFAULT_RADIUS_RANGE: readonly [number, number] = [3, 12];

/** Default point radius when no size encoding is present. */
export const DEFAULT_POINT_RADIUS = 4;

/**
 * A positional scale bundle: the serialisable ResolvedScale plus the
 * underlying d3 scale, which tick computation and the geometry builders read.
 */
export type PositionalScale =
  | {
      readonly kind: 'linear';
      readonly resolved: ResolvedScale;
      readonly d3: ScaleLinear<number, number>;
    }
  | {
      readonly kind: 'utc';
      readonly resolved: ResolvedScale;
      readonly d3: ScaleTime<number, number>;
    }
  | { readonly kind: 'band'; readonly resolved: ResolvedScale; readonly d3: ScaleBand<string> }
  | { readonly kind: 'point'; readonly resolved: ResolvedScale; readonly d3: ScalePoint<string> };

/**
 * Resolves a positional (x or y) scale from a channel's declared type.
 *
 * - `quantitative` → linear
 * - `temporal` → UTC time (UTC for cross-platform determinism)
 * - `ordinal`/`nominal` → band for bar marks (bars need bandwidth),
 *   point for line/point/area marks (single positions)
 */
export function resolvePositionalScale(
  channel: Channel,
  mark: Mark,
  pixelRange: readonly [number, number],
  data: DataRows,
  hint?: ScaleHint,
  rangeEnd?: Channel,
): PositionalScale {
  switch (channel.type) {
    case 'quantitative':
      return resolveLinear(channel, mark, pixelRange, data, hint, rangeEnd);
    case 'temporal':
      return resolveUtc(channel, pixelRange, data, hint, rangeEnd);
    case 'ordinal':
    case 'nominal':
      return resolveCategorical(channel, mark, pixelRange, data, hint);
  }
}

function resolveLinear(
  channel: Channel,
  mark: Mark,
  pixelRange: readonly [number, number],
  data: DataRows,
  hint?: ScaleHint,
  rangeEnd?: Channel,
): PositionalScale {
  let domain: [number, number];

  const hintDomain = numericHintDomain(hint);
  if (hintDomain) {
    domain = hintDomain;
  } else {
    const values = valuesOf(data, channel, rangeEnd).filter(
      (value): value is number => typeof value === 'number',
    );
    domain = values.length > 0 ? [Math.min(...values), Math.max(...values)] : [0, 1];
  }

  // Bars are drawn from a zero baseline, so their quantitative axis must
  // include zero; a range bar has its own start, so it does not. Otherwise
  // zero is opt-in via the spec hint.
  const includeZero = hint?.zero ?? (mark === 'bar' && rangeEnd === undefined);
  if (includeZero) {
    domain = [Math.min(domain[0], 0), Math.max(domain[1], 0)];
  }

  // Degenerate domain (single distinct value): pad so the scale is usable.
  if (domain[0] === domain[1]) {
    domain = [domain[0] - 1, domain[1] + 1];
  }

  let d3Scale = scaleLinear().domain(domain).range(pixelRange);
  if (hint?.nice) {
    d3Scale = d3Scale.nice();
  }

  const finalDomain = d3Scale.domain() as [number, number];
  return {
    kind: 'linear',
    d3: d3Scale,
    resolved: {
      kind: 'linear',
      domain: finalDomain,
      range: [...pixelRange],
      apply: (value) => (typeof value === 'number' ? d3Scale(value) : undefined),
      bandwidth: 0,
    },
  };
}

function resolveUtc(
  channel: Channel,
  pixelRange: readonly [number, number],
  data: DataRows,
  hint?: ScaleHint,
  rangeEnd?: Channel,
): PositionalScale {
  let domain: [Date, Date];

  const hintDomain = temporalHintDomain(hint);
  if (hintDomain) {
    domain = hintDomain;
  } else {
    const times = valuesOf(data, channel, rangeEnd)
      .filter((value): value is Date => value instanceof Date)
      .map((value) => value.getTime());
    domain =
      times.length > 0
        ? [new Date(Math.min(...times)), new Date(Math.max(...times))]
        : [new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2000, 0, 2))];
  }

  // Degenerate domain: pad by one day either side.
  if (domain[0].getTime() === domain[1].getTime()) {
    const dayMs = 24 * 60 * 60 * 1000;
    domain = [new Date(domain[0].getTime() - dayMs), new Date(domain[1].getTime() + dayMs)];
  }

  let d3Scale = scaleUtc().domain(domain).range(pixelRange);
  if (hint?.nice) {
    d3Scale = d3Scale.nice();
  }

  const finalDomain = d3Scale.domain() as [Date, Date];
  return {
    kind: 'utc',
    d3: d3Scale,
    resolved: {
      kind: 'utc',
      domain: finalDomain,
      range: [...pixelRange],
      apply: (value) => (value instanceof Date ? d3Scale(value) : undefined),
      bandwidth: 0,
    },
  };
}

/** Every value of `channel` and, for a range, of its end channel `rangeEnd`. */
function valuesOf(data: DataRows, channel: Channel, rangeEnd?: Channel): FieldValue[] {
  const accessors =
    rangeEnd === undefined
      ? [makeAccessor(channel)]
      : [makeAccessor(channel), makeAccessor(rangeEnd)];
  return data.flatMap((datum) => accessors.map((accessor) => accessor(datum)));
}

function resolveCategorical(
  channel: Channel,
  mark: Mark,
  pixelRange: readonly [number, number],
  data: DataRows,
  hint?: ScaleHint,
): PositionalScale {
  const domain = categoricalDomain(channel, data, hint);

  if (mark === 'bar') {
    const d3Scale = scaleBand<string>().domain(domain).range(pixelRange).padding(0.1);
    return {
      kind: 'band',
      d3: d3Scale,
      resolved: {
        kind: 'band',
        domain,
        range: [...pixelRange],
        apply: (value) => d3Scale(asCategory(value)),
        bandwidth: d3Scale.bandwidth(),
      },
    };
  }

  const d3Scale = scalePoint<string>().domain(domain).range(pixelRange).padding(0.5);
  return {
    kind: 'point',
    d3: d3Scale,
    resolved: {
      kind: 'point',
      domain,
      range: [...pixelRange],
      apply: (value) => d3Scale(asCategory(value)),
      bandwidth: 0,
    },
  };
}

/**
 * Resolves the colour scale for a colour channel.
 *
 * - `ordinal`/`nominal` → categorical palette
 * - `quantitative`/`temporal` → normalised [0, 1] linear scale; interpreters
 *   map the normalised value onto their own gradient
 */
export function resolveColorScale(channel: Channel, data: DataRows): ResolvedScale {
  if (channel.type === 'ordinal' || channel.type === 'nominal') {
    const domain = categoricalDomain(channel, data);
    const d3Scale = scaleOrdinal<string, string>()
      .domain(domain)
      .range(CATEGORICAL_PALETTE.slice(0, Math.max(domain.length, 1)));
    return {
      kind: 'ordinal',
      domain,
      range: domain.map((category) => d3Scale(category)),
      apply: (value) => d3Scale(asCategory(value)),
      bandwidth: 0,
    };
  }

  const accessor = makeAccessor(channel);
  const values: number[] = [];
  for (const datum of data) {
    const value = accessor(datum);
    if (typeof value === 'number') values.push(value);
    else if (value instanceof Date) values.push(value.getTime());
  }
  const domain: [number, number] =
    values.length > 0 ? [Math.min(...values), Math.max(...values)] : [0, 1];
  const d3Scale = scaleLinear().domain(domain).range([0, 1]);
  return {
    kind: 'linear',
    domain,
    range: [0, 1],
    apply: (value) => {
      if (typeof value === 'number') return d3Scale(value);
      if (value instanceof Date) return d3Scale(value.getTime());
      return undefined;
    },
    bandwidth: 0,
  };
}

/**
 * Resolves the size scale for point marks: quantitative values map onto a
 * radius range with square-root scaling so symbol *area* is proportional to
 * the value.
 */
export function resolveSizeScale(channel: Channel, data: DataRows): ResolvedScale {
  const accessor = makeAccessor(channel);
  const values: number[] = [];
  for (const datum of data) {
    const value = accessor(datum);
    if (typeof value === 'number') values.push(value);
  }
  const domain: [number, number] =
    values.length > 0 ? [Math.min(...values), Math.max(...values)] : [0, 1];
  const d3Scale = scaleSqrt().domain(domain).range(DEFAULT_RADIUS_RANGE);
  return {
    kind: 'linear',
    domain,
    range: [...DEFAULT_RADIUS_RANGE],
    apply: (value) => (typeof value === 'number' ? d3Scale(value) : undefined),
    bandwidth: 0,
  };
}

function numericHintDomain(hint?: ScaleHint): [number, number] | undefined {
  if (!hint?.domain || hint.domain.length < 2) return undefined;
  const [min, max] = [hint.domain[0], hint.domain[hint.domain.length - 1]];
  if (typeof min === 'number' && typeof max === 'number') return [min, max];
  return undefined;
}

function temporalHintDomain(hint?: ScaleHint): [Date, Date] | undefined {
  if (!hint?.domain || hint.domain.length < 2) return undefined;
  const min = new Date(hint.domain[0] as string | number);
  const max = new Date(hint.domain[hint.domain.length - 1] as string | number);
  if (!Number.isNaN(min.getTime()) && !Number.isNaN(max.getTime())) return [min, max];
  return undefined;
}

function categoricalDomain(channel: Channel, data: DataRows, hint?: ScaleHint): string[] {
  if (hint?.domain && hint.domain.length > 0) {
    return hint.domain.map((value) => String(value));
  }
  const accessor = makeAccessor(channel);
  const seen = new Set<string>();
  const domain: string[] = [];
  for (const datum of data) {
    const value = accessor(datum);
    if (typeof value === 'string' && !seen.has(value)) {
      seen.add(value);
      domain.push(value);
    }
  }
  return domain;
}

function asCategory(value: DomainValue): string {
  return typeof value === 'string' ? value : String(value);
}
