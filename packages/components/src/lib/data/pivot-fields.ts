/**
 * The configurator's edits to a `PivotConfig`: moving a field between rows,
 * columns and values, reordering, removing, and changing an aggregate. Each
 * returns a new config, so the table re-pivots from one assignment.
 *
 * @module
 */

import type { PivotAggregate, PivotConfig } from './pivot.ts';

/** A field the configurator offers. */
export interface PivotField<R> {
  readonly name: keyof R & string;
  readonly label: string;
  /** A measure sums when added to values; a dimension counts. @defaultValue `'dimension'` */
  readonly kind?: 'dimension' | 'measure' | undefined;
}

/** One item of a field's menu in the configurator. */
export interface PivotFieldAction {
  readonly label: string;
  readonly disabled?: boolean | undefined;
  readonly run: () => void;
}

/** Where a field sits in the configurator. */
export type PivotZone = 'rows' | 'columns' | 'values';

/** The aggregates the configurator offers, in menu order. */
export const pivotAggregates = [
  'sum',
  'count',
  'countDistinct',
  'mean',
  'median',
  'min',
  'max',
] as const satisfies readonly PivotAggregate[];

/** One of {@link pivotAggregates}. */
export type PivotBuiltInAggregate = (typeof pivotAggregates)[number];

export const isBuiltInAggregate = (value: unknown): value is PivotBuiltInAggregate =>
  pivotAggregates.some((each) => each === value);

const without = <T>(list: readonly T[], index: number): T[] => list.filter((_, at) => at !== index);

/** Takes the item at `index` out of `zone`. */
export const removeFromZone = <R>(
  config: PivotConfig<R>,
  zone: PivotZone,
  index: number,
): PivotConfig<R> =>
  zone === 'values'
    ? { ...config, values: without(config.values, index) }
    : { ...config, [zone]: without(config[zone], index) };

/**
 * Adds `field` to the end of `zone`. A dimension is on one axis at a time,
 * so adding it to rows takes it off columns and the other way round.
 */
export const addToZone = <R>(
  config: PivotConfig<R>,
  field: PivotField<R>,
  zone: PivotZone,
): PivotConfig<R> => {
  const { name } = field;
  if (zone === 'values') {
    const agg = field.kind === 'measure' ? 'sum' : 'count';
    return { ...config, values: [...config.values, { field: name, agg }] };
  }
  const other = zone === 'rows' ? 'columns' : 'rows';
  return {
    ...config,
    [zone]: [...config[zone].filter((each) => each !== name), name],
    [other]: config[other].filter((each) => each !== name),
  };
};

/** Moves the item at `index` one place earlier (`-1`) or later (`1`) in its zone. */
export const shiftInZone = <R>(
  config: PivotConfig<R>,
  zone: PivotZone,
  index: number,
  by: -1 | 1,
): PivotConfig<R> => {
  const swap = <T>(list: readonly T[]): T[] => {
    const target = index + by;
    const a = list[index];
    const b = list[target];
    if (a === undefined || b === undefined) return [...list];
    return list.map((each, at) => (at === index ? b : at === target ? a : each));
  };
  return zone === 'values'
    ? { ...config, values: swap(config.values) }
    : { ...config, [zone]: swap(config[zone]) };
};

/** Sets the aggregate of the measure at `index`. */
export const setAggregate = <R>(
  config: PivotConfig<R>,
  index: number,
  agg: PivotAggregate,
): PivotConfig<R> => ({
  ...config,
  values: config.values.map((value, at) => (at === index ? { ...value, agg } : value)),
});

/** Fields on neither axis, for the "add" list. A measure stays addable to values. */
export const unplacedFields = <R>(
  config: PivotConfig<R>,
  fields: readonly PivotField<R>[],
): PivotField<R>[] =>
  fields.filter(
    (field) =>
      !config.rows.includes(field.name) &&
      !config.columns.includes(field.name) &&
      !config.values.some((value) => value.field === field.name),
  );

/** Every string the configurator shows. */
export interface PivotFieldsLabels {
  readonly configurator: string;
  readonly rows: string;
  readonly columns: string;
  readonly values: string;
  readonly fields: string;
  readonly none: string;
  readonly aggregate: string;
  readonly moveUp: string;
  readonly moveDown: string;
  readonly remove: string;
  readonly moveTo: (zone: string) => string;
  readonly addTo: (zone: string) => string;
  /** A field's menu name. */
  readonly options: (field: string) => string;
  /** Read out after each change, each list already joined. */
  readonly summary: (rows: string, columns: string, values: string) => string;
}

/** The configurator's English strings. */
export const defaultPivotFieldsLabels: PivotFieldsLabels = {
  configurator: 'Pivot fields',
  rows: 'Rows',
  columns: 'Columns',
  values: 'Values',
  fields: 'Fields',
  none: 'None',
  aggregate: 'Aggregate',
  moveUp: 'Move up',
  moveDown: 'Move down',
  remove: 'Remove',
  moveTo: (zone) => `Move to ${zone}`,
  addTo: (zone) => `Add to ${zone}`,
  options: (field) => `${field} options`,
  summary: (rows, columns, values) => `Rows: ${rows}. Columns: ${columns}. Values: ${values}.`,
};
