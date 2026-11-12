/**
 * `ganttSpec`: a pure builder for a spec 1.1 range-bar chart (a Gantt), one
 * row per task from its start to its end. It returns a spec, never draws
 * one, so every interpreter renders it.
 *
 * A Gantt reads top-down. The core draws a categorical `y` with the first
 * category at the top, as Vega-Lite and ChartSpecKit do (#305), so the
 * builder only has to put the tasks in start order in `scales.y.domain`.
 * There is no per-interpreter domain trick.
 *
 * @module
 */

import type { ChartSpec, Datum, DatumValue, FieldType } from './types.ts';

/** The fields of each row that `ganttSpec` reads. */
export interface GanttFields {
  /** The task name: one row (a `y` band) per distinct value. */
  readonly task: string;
  /** Where the bar starts. */
  readonly start: string;
  /** Where the bar ends. */
  readonly end: string;
  /** A category to colour bars by (a phase, an owner). */
  readonly group?: string | undefined;
}

/** Options for {@link ganttSpec}. */
export interface GanttOptions extends GanttFields {
  /** The chart's title, also its accessible name in the interpreters that draw one. */
  readonly title?: string | undefined;
  /**
   * How `start` and `end` are read: dates (ISO strings or epoch milliseconds) or plain numbers (days, sprints).
   * @defaultValue `'temporal'`
   */
  readonly time?: Extract<FieldType, 'temporal' | 'quantitative'> | undefined;
}

/** A start value as a number for ordering; `undefined` sorts last. */
const startKey = (value: DatumValue | undefined): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const byStart =
  (field: string) =>
  (a: Datum, b: Datum): number => {
    const left = startKey(a[field]);
    const right = startKey(b[field]);
    if (left === undefined) return right === undefined ? 0 : 1;
    if (right === undefined) return -1;
    return left - right;
  };

/** Each task once, in the order its earliest row starts. */
const taskOrder = (rows: ReadonlyArray<Datum>, field: string): string[] => [
  ...new Set(rows.map((row) => String(row[field] ?? ''))),
];

/**
 * Build a spec 1.1 Gantt chart from `rows`. The rows are sorted by `start`
 * (rows with an unreadable start go last; ties keep their input order). `y` is
 * the nominal `task`, `x` / `x2` are `start` / `end`, and `color` is the
 * nominal `group` when one is given. `scales.y.domain` lists the tasks in
 * start order, so the earliest task is the top row in every interpreter.
 */
export function ganttSpec(rows: ReadonlyArray<Datum>, options: GanttOptions): ChartSpec {
  const time = options.time ?? 'temporal';
  const sorted = rows.toSorted(byStart(options.start));
  return {
    specVersion: '1.1',
    mark: 'bar',
    encoding: {
      y: { field: options.task, type: 'nominal' },
      x: { field: options.start, type: time },
      x2: { field: options.end, type: time },
      ...(options.group === undefined ? {} : { color: { field: options.group, type: 'nominal' } }),
    },
    data: { values: sorted },
    scales: {
      y: { domain: taskOrder(sorted, options.task) },
      // A number line of days or sprints starts where the work does, not at 0.
      ...(time === 'quantitative' ? { x: { zero: false } } : {}),
    },
    ...(options.title === undefined ? {} : { config: { title: options.title } }),
  };
}
