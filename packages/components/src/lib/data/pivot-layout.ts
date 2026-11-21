/**
 * `PivotTable`'s table layout: the header rows (column groups, a total
 * column, measure labels) and the body rows (row groups with subtotals,
 * collapsed groups, a total row), each data cell with the ids of every
 * header that names it. Pure, so the `headers` wiring is tested directly.
 *
 * @module
 */

import {
  groupsAtDepth,
  leafCount,
  leafGroups,
  type PivotGroup,
  type PivotResult,
} from './pivot.ts';

/** A header cell. `group` is a column group, `total` the total column, `value` a measure. */
export interface PivotHeaderCell {
  readonly id: string;
  readonly kind: 'group' | 'total' | 'value';
  readonly group?: PivotGroup | undefined;
  /** The measure's index, for a `value` cell. */
  readonly value?: number | undefined;
  readonly colSpan: number;
  readonly rowSpan: number;
}

/** A data cell: where it sits and which headers name it. */
export interface PivotDataCell {
  readonly rowPath: readonly string[];
  readonly colPath: readonly string[];
  readonly value: number;
  /** Space-separated header ids: row headers outermost first, then column headers, then the measure. */
  readonly headers: string;
}

/** A body row: a row group (or the total) with its cells, or none while they are hidden. */
export interface PivotBodyRow {
  readonly id: string;
  /** The group; `undefined` for the total row. */
  readonly group: PivotGroup | undefined;
  readonly parent: boolean;
  readonly expanded: boolean;
  /** Empty for an expanded group without subtotals. */
  readonly cells: readonly PivotDataCell[];
}

/** The whole table. */
export interface PivotLayout {
  /** Header rows above the body; the row-header column's corner spans them all. */
  readonly head: readonly (readonly PivotHeaderCell[])[];
  readonly body: readonly PivotBodyRow[];
  /** Data columns (column slots × measures), for an empty row's span. */
  readonly width: number;
}

/** Options for {@link pivotLayout}. */
export interface PivotLayoutOptions {
  /** Prefix for every id. */
  readonly idPrefix: string;
  readonly rowFields: number;
  readonly columnFields: number;
  readonly values: number;
  /** Ids of expanded row groups (by `pathId`). */
  readonly expanded: ReadonlySet<string>;
  readonly subtotals: boolean;
  readonly grandTotals: boolean;
}

/** A stable id for a group path, safe in an HTML id. */
export const pathId = (path: readonly string[]): string =>
  Array.from(JSON.stringify(path), (char) => char.codePointAt(0)?.toString(36) ?? '').join('');

const columnHead = (
  result: PivotResult,
  options: PivotLayoutOptions,
  totalColumn: boolean,
  slots: readonly { readonly path: readonly string[]; readonly id: string }[],
): PivotHeaderCell[][] => {
  const { idPrefix, columnFields, values } = options;
  const rows: PivotHeaderCell[][] = [];
  for (let depth = 0; depth < columnFields; depth += 1) {
    const cells: PivotHeaderCell[] = groupsAtDepth(result.columns, depth).map((group) => ({
      id: `${idPrefix}-c${pathId(group.path)}`,
      kind: 'group',
      group,
      colSpan: leafCount(group) * values,
      rowSpan: group.children.length === 0 ? columnFields - depth : 1,
    }));
    if (depth === 0 && totalColumn) {
      cells.push({ id: `${idPrefix}-ct`, kind: 'total', colSpan: values, rowSpan: columnFields });
    }
    rows.push(cells);
  }
  rows.push(
    slots.flatMap((slot) =>
      Array.from({ length: values }, (_, value) => ({
        id: `${slot.id}-v${value}`,
        kind: 'value' as const,
        value,
        colSpan: 1,
        rowSpan: 1,
      })),
    ),
  );
  return rows;
};

/** Lays out a pivot as header rows and body rows, with `headers` for every data cell. */
export const pivotLayout = (result: PivotResult, options: PivotLayoutOptions): PivotLayout => {
  const { idPrefix, rowFields, columnFields, values, expanded, subtotals, grandTotals } = options;
  const totalColumn = grandTotals && columnFields > 0;
  const columnIds = (path: readonly string[]): string[] =>
    path.map((_, index) => `${idPrefix}-c${pathId(path.slice(0, index + 1))}`);
  const slots = [
    ...(columnFields === 0 ? [{ path: [] as string[] }] : leafGroups(result.columns)).map(
      (group) => ({
        path: group.path,
        id: `${idPrefix}-s${pathId(group.path)}`,
        names: columnIds(group.path),
      }),
    ),
    ...(totalColumn
      ? [{ path: [] as string[], id: `${idPrefix}-st`, names: [`${idPrefix}-ct`] }]
      : []),
  ];

  const cellsFor = (rowPath: readonly string[], rowNames: readonly string[]): PivotDataCell[] =>
    slots.flatMap((slot) =>
      Array.from({ length: values }, (_, value) => ({
        rowPath,
        colPath: slot.path,
        value,
        headers: [...rowNames, ...slot.names, `${slot.id}-v${value}`].join(' '),
      })),
    );

  const body: PivotBodyRow[] = [];
  const walk = (groups: readonly PivotGroup[], names: readonly string[]): void => {
    for (const group of groups) {
      const id = `${idPrefix}-r${pathId(group.path)}`;
      const parent = group.children.length > 0;
      const open = parent && expanded.has(pathId(group.path));
      const own = [...names, id];
      body.push({
        id,
        group,
        parent,
        expanded: open,
        cells: !open || subtotals ? cellsFor(group.path, own) : [],
      });
      if (open) walk(group.children, own);
    }
  };
  if (rowFields > 0) walk(result.rows, []);
  if (rowFields === 0 || grandTotals) {
    const id = `${idPrefix}-rt`;
    body.push({ id, group: undefined, parent: false, expanded: false, cells: cellsFor([], [id]) });
  }

  return {
    head: columnHead(result, options, totalColumn, slots),
    body,
    width: slots.length * values,
  };
};

/** `pathId`s of every row group that has children, for expanding all. */
export const parentIds = (groups: readonly PivotGroup[]): string[] =>
  groups.flatMap((group) =>
    group.children.length === 0 ? [] : [pathId(group.path), ...parentIds(group.children)],
  );
