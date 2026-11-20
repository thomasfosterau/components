/**
 * The pivot engine behind `PivotTable`: rows grouped by chosen dimensions
 * on two axes and measures aggregated at every level, so subtotals and
 * totals come from the same index. No DOM, so it runs anywhere, a server
 * included, and is tested without a browser.
 *
 * @module
 */

/** How a measure's values in one cell become a number. */
export type PivotAggregate =
  | 'sum'
  | 'count'
  | 'countDistinct'
  | 'mean'
  | 'median'
  | 'min'
  | 'max'
  | ((values: readonly unknown[]) => number | undefined);

/** How a date field is bucketed before grouping. */
export type PivotDateGrouping = 'year' | 'quarter' | 'month' | 'week' | 'day';

/** A measure: a field, how it aggregates, and how it reads. */
export interface PivotValue<R> {
  readonly field: keyof R & string;
  readonly agg: PivotAggregate;
  /** The header text; defaults to "Sum of kg" from the field's label. */
  readonly label?: string | undefined;
  readonly format?: Intl.NumberFormatOptions | undefined;
}

/** Which fields go where. */
export interface PivotConfig<R> {
  readonly rows: readonly (keyof R & string)[];
  readonly columns: readonly (keyof R & string)[];
  readonly values: readonly PivotValue<R>[];
  /** Only rows whose field holds one of these values (compared as group keys). */
  readonly filters?: Partial<Record<keyof R & string, readonly unknown[]>> | undefined;
  /** Bucket date fields (a `Date` or an ISO string) before grouping. */
  readonly dateGrouping?: Partial<Record<keyof R & string, PivotDateGrouping>> | undefined;
}

/** One header group on an axis: a value of one dimension under its ancestors. */
export interface PivotGroup {
  /** The group key: what the values of this dimension were grouped by. */
  readonly key: string;
  /** Keys from the top of the axis down to this group. */
  readonly path: readonly string[];
  /** 0 for the first dimension. */
  readonly depth: number;
  readonly children: readonly PivotGroup[];
}

/** A pivot: the two header trees, and every cell at every level. */
export interface PivotResult {
  readonly rows: readonly PivotGroup[];
  readonly columns: readonly PivotGroup[];
  /**
   * The value of measure `value` over the records under `rowPath` and
   * `colPath`; a shorter path is a subtotal, an empty one the total.
   * `undefined` when no record falls there.
   */
  readonly cell: (
    rowPath: readonly string[],
    colPath: readonly string[],
    value: number,
  ) => number | undefined;
}

const pad = (value: number): string => String(value).padStart(2, '0');

const isoWeek = (date: Date): string => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${pad(week)}`;
};

/** A date bucketed as a sortable key: `2026`, `2026-Q1`, `2026-03`, `2026-W12`, `2026-03-04`. */
export const dateKey = (value: unknown, grouping: PivotDateGrouping): string => {
  const date =
    value instanceof Date ? value : typeof value === 'string' ? new Date(value) : undefined;
  if (date === undefined || Number.isNaN(date.getTime())) return '';
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  switch (grouping) {
    case 'year':
      return String(year);
    case 'quarter':
      return `${year}-Q${Math.ceil(month / 3)}`;
    case 'month':
      return `${year}-${pad(month)}`;
    case 'week':
      return isoWeek(date);
    default:
      return `${year}-${pad(month)}-${pad(date.getUTCDate())}`;
  }
};

/** A field's value as a group key; `''` for a missing one. */
const keyOf = (value: unknown, grouping: PivotDateGrouping | undefined): string => {
  if (grouping !== undefined) return dateKey(value, grouping);
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value) ?? '';
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Group keys in order: numbers by value, text naturally, the blank key last. */
export const compareKeys = (a: string, b: string): number => {
  if (a === '' || b === '') return a === b ? 0 : a === '' ? 1 : -1;
  return collator.compare(a, b);
};

const numbers = (values: readonly unknown[]): number[] =>
  values.flatMap((value) => {
    const number = typeof value === 'number' ? value : Number(value);
    return value === null || value === '' || !Number.isFinite(number) ? [] : [number];
  });

const median = (values: readonly number[]): number | undefined => {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return undefined;
  return sorted.length % 2 === 1
    ? sorted[middle]
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

const aggregators: Record<
  Exclude<PivotAggregate, (values: readonly unknown[]) => number | undefined>,
  (values: readonly unknown[]) => number | undefined
> = {
  sum: (values) => numbers(values).reduce((total, value) => total + value, 0),
  count: (values) => values.length,
  countDistinct: (values) => new Set(values).size,
  mean: (values) => {
    const found = numbers(values);
    return found.length === 0
      ? undefined
      : found.reduce((total, value) => total + value, 0) / found.length;
  },
  median: (values) => median(numbers(values)),
  min: (values) => {
    const found = numbers(values);
    return found.length === 0 ? undefined : Math.min(...found);
  },
  max: (values) => {
    const found = numbers(values);
    return found.length === 0 ? undefined : Math.max(...found);
  },
};

/** Applies an aggregate to the values one cell holds. */
export const aggregate = (agg: PivotAggregate, values: readonly unknown[]): number | undefined =>
  typeof agg === 'function' ? agg(values) : aggregators[agg](values);

/** Every prefix of `keys`, the empty one first. */
const prefixes = (keys: readonly string[]): string[][] =>
  Array.from({ length: keys.length + 1 }, (_, length) => keys.slice(0, length));

const bucketKey = (rowPath: readonly string[], colPath: readonly string[]): string =>
  JSON.stringify([rowPath, colPath]);

interface Node {
  readonly children: Map<string, Node>;
}

const insert = (root: Node, keys: readonly string[]): void => {
  let node = root;
  for (const key of keys) {
    let next = node.children.get(key);
    if (next === undefined) {
      next = { children: new Map() };
      node.children.set(key, next);
    }
    node = next;
  }
};

const groupsOf = (node: Node, path: readonly string[]): PivotGroup[] =>
  [...node.children.entries()]
    .toSorted(([a], [b]) => compareKeys(a, b))
    .map(([key, child]) => ({
      key,
      path: [...path, key],
      depth: path.length,
      children: groupsOf(child, [...path, key]),
    }));

const hasField = <R>(record: R, field: string): field is keyof R & string =>
  typeof record === 'object' && record !== null && field in record;

const passes = <R>(record: R, config: PivotConfig<R>): boolean =>
  Object.entries(config.filters ?? {}).every(([field, allowed]) => {
    if (!Array.isArray(allowed)) return true;
    const key = hasField(record, field) ? keyOf(record[field], config.dateGrouping?.[field]) : '';
    return allowed.some((value) => keyOf(value, undefined) === key);
  });

/**
 * Pivots `records`: groups them by `config.rows` and `config.columns`, and
 * collects every measure's values under every prefix of both, in one pass.
 */
export const pivot = <R>(records: readonly R[], config: PivotConfig<R>): PivotResult => {
  const rowRoot: Node = { children: new Map() };
  const colRoot: Node = { children: new Map() };
  const buckets = new Map<string, unknown[][]>();
  const keysFor = (record: R, fields: readonly (keyof R & string)[]): string[] =>
    fields.map((field) => keyOf(record[field], config.dateGrouping?.[field]));
  const collect = (rowPath: readonly string[], colPath: readonly string[], record: R): void => {
    const key = bucketKey(rowPath, colPath);
    const bucket = buckets.get(key) ?? config.values.map(() => []);
    buckets.set(key, bucket);
    for (const [index, value] of config.values.entries()) bucket[index]?.push(record[value.field]);
  };

  for (const record of records.filter((each) => passes(each, config))) {
    const rowKeys = keysFor(record, config.rows);
    const colKeys = keysFor(record, config.columns);
    insert(rowRoot, rowKeys);
    insert(colRoot, colKeys);
    const colPaths = prefixes(colKeys);
    for (const rowPath of prefixes(rowKeys)) {
      for (const colPath of colPaths) collect(rowPath, colPath, record);
    }
  }

  const compute = (key: string, value: number): number | undefined => {
    const values = buckets.get(key)?.[value];
    const measure = config.values[value];
    return values === undefined || measure === undefined
      ? undefined
      : aggregate(measure.agg, values);
  };
  const cache = new Map<string, number | undefined>();
  return {
    rows: groupsOf(rowRoot, []),
    columns: groupsOf(colRoot, []),
    cell: (rowPath, colPath, value) => {
      const key = bucketKey(rowPath, colPath);
      const cached = `${key}#${value}`;
      if (!cache.has(cached)) cache.set(cached, compute(key, value));
      return cache.get(cached);
    },
  };
};

/** The leaves of a header tree, left to right. */
export const leafGroups = (groups: readonly PivotGroup[]): PivotGroup[] =>
  groups.flatMap((group) => (group.children.length === 0 ? [group] : leafGroups(group.children)));

/** How many leaves sit under `group` (1 for a leaf). */
export const leafCount = (group: PivotGroup): number =>
  group.children.length === 0
    ? 1
    : group.children.reduce((total, child) => total + leafCount(child), 0);

/** The header groups at one depth, left to right. */
export const groupsAtDepth = (groups: readonly PivotGroup[], depth: number): PivotGroup[] =>
  depth === 0 ? [...groups] : groups.flatMap((group) => groupsAtDepth(group.children, depth - 1));
