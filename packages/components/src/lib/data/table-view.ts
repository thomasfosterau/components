/**
 * What `Table` and the editing `DataGrid`'s grid derive the same way from
 * their props: the columns on screen, the columns menu's entries, the
 * selection labels with their English defaults, and the sort arrow. Shared
 * so the two cannot drift; internal, not exported.
 *
 * @module
 */

import {
  defaultHiddenColumns,
  isColumnHideable,
  type SortState,
  type TableChoiceProps,
  type TableColumn,
} from './table-types.ts';

/** One entry of the columns menu. */
export interface ColumnChoice {
  readonly key: string;
  readonly header: string;
  readonly hideable: boolean;
  readonly visible: boolean;
}

/** The columns a table draws, the keys it hides, and the columns menu. */
export interface ColumnView<T> {
  readonly hidden: Set<string>;
  readonly shown: readonly TableColumn<T>[];
  /** The columns menu's entries; empty without a menu. */
  readonly choices: readonly ColumnChoice[];
}

/** Which columns are drawn, from the bound `hiddenColumns` or the columns' `defaultHidden`. */
export function columnView<T>(
  columns: readonly TableColumn<T>[],
  hiddenColumns: ReadonlySet<string> | undefined,
  columnMenu: boolean,
): ColumnView<T> {
  const hidden = new Set(hiddenColumns ?? defaultHiddenColumns(columns));
  const isShown = (column: TableColumn<T>, index: number): boolean =>
    !(isColumnHideable(column, index) && hidden.has(column.key));
  return {
    hidden,
    shown: columns.filter(isShown),
    choices: columnMenu
      ? columns.map((column, index) => ({
          key: column.key,
          header: column.header,
          hideable: isColumnHideable(column, index),
          visible: isShown(column, index),
        }))
      : [],
  };
}

/** The selection and columns-menu strings, defaults applied. */
export interface ChoiceLabels<T> {
  readonly selectRowLabel: (row: T) => string;
  readonly selectAllLabel: string;
  readonly selectColumnLabel: string;
  readonly selectedCountLabel: (count: number) => string;
  readonly columnMenuLabel: string;
}

/** The caller's selection and columns-menu strings, each falling back to its English default. */
export function choiceLabels<T>(
  given: Pick<TableChoiceProps<T>, keyof ChoiceLabels<T>>,
  columns: readonly TableColumn<T>[],
): ChoiceLabels<T> {
  return {
    selectRowLabel:
      given.selectRowLabel ??
      ((row) => `Select ${columns[0] === undefined ? '' : String(columns[0].value(row))}`),
    selectAllLabel: given.selectAllLabel ?? 'Select all on this page',
    selectColumnLabel: given.selectColumnLabel ?? 'Select',
    selectedCountLabel: given.selectedCountLabel ?? ((count) => `${count} selected`),
    columnMenuLabel: given.columnMenuLabel ?? 'Columns',
  };
}

/** The arrow beside a sorted header. Decorative — `aria-sort` is the state. */
export function sortIndicator(sort: SortState | undefined, key: string): string {
  if (sort === undefined || sort.key !== key) return '';
  return sort.direction === 'asc' ? '▲' : '▼';
}
