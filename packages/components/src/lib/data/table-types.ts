/**
 * The column spec `Table` and `DataGrid` share.
 *
 * Declarative data rather than a table engine. The apps this is consolidated
 * from were built on `@tanstack/svelte-table` — a column helper, a
 * `createTable` instance, four row-model factories and a `FlexRender`
 * indirection — which is ~40 kB of client JavaScript for tables whose whole
 * job is to show rows, sort one column and page. The spec below is data, and
 * the sorting / filtering / paging live in `DataGrid`'s own derivations.
 * Reach for an engine again when something needs column resizing, grouping
 * or virtualisation; none of those are on the map.
 *
 * @module
 */

import type { Snippet } from 'svelte';
import type { FieldControl, FieldOptionInput } from '../fields/field-types.ts';

/**
 * One column of a table.
 *
 * `value` is required and does triple duty: it is the cell's text, the key
 * the column sorts on, and the corpus `DataGrid`'s filter searches. One
 * accessor for all three is what stops a grid that sorts a column by one
 * thing and shows another — the failure mode of a spec where they are
 * separate. `cell` layers richer markup (a link, a badge, a formatted date)
 * over that same value.
 */
export interface TableColumn<T> {
  /** Stable id — the `{#each}` key and the sort state's handle. */
  readonly key: string;
  /** The `<th>` text, already in the caller's language. */
  readonly header: string;
  /** The cell's text, its sort key, and what a filter matches against. */
  readonly value: (row: T) => string | number;
  /** Richer cell markup; `value`'s result is rendered when omitted. */
  readonly cell?: Snippet<[T]> | undefined;
  /** Whether the header offers a sort control on this column. */
  readonly sortable?: boolean | undefined;
  /**
   * Render this column's body cells as `<th scope="row">` — the row's header,
   * so a screen reader moving down another column announces it with each cell
   * ("Jane Smith, 48,000"). Give it to the column that names the row, usually
   * one per table.
   */
  readonly rowHeader?: boolean | undefined;
  /** Right-align numeric columns. */
  readonly align?: 'start' | 'end' | undefined;
  /** Extra classes on this column's header and body cells. */
  readonly class?: string | undefined;
  /**
   * Extra classes on this column's `<th scope="col">` only, after `class` —
   * `'sr-only'` keeps a header for screen readers over visible cells.
   */
  readonly headerClass?: string | undefined;
  /**
   * Whether the reader may hide this column from the columns menu. The first
   * column names the row and is never hideable, whatever this says.
   * @defaultValue `true`
   */
  readonly hideable?: boolean | undefined;
  /** Hidden until the reader shows it, while the table's `hiddenColumns` is unset. */
  readonly defaultHidden?: boolean | undefined;
  /**
   * Whether an editing `DataGrid` lets the reader edit this column's cells —
   * for every row, or per row. `Table` ignores it.
   */
  readonly editable?: boolean | ((row: T) => boolean) | undefined;
  /**
   * The control an editable cell edits with: one of the library's own field
   * primitives, or a snippet for anything else.
   * @defaultValue `'text'`
   */
  readonly editor?: CellEditor<T> | undefined;
  /**
   * The value the editor starts from and a change's `from` — the raw value
   * (a `boolean`, a `DateValue`), where `value` is the text shown and sorted.
   * @defaultValue `value`
   */
  readonly editValue?: ((row: T) => unknown) | undefined;
  /** The choices of a `'select'` editor. */
  readonly options?: readonly FieldOptionInput[] | undefined;
  /**
   * The messages an edited value fails with; empty when it is valid. Also run
   * over every row's current value, so data that arrives invalid is marked.
   */
  readonly validate?: ((value: unknown, row: T) => readonly string[]) | undefined;
  /**
   * A `'text'` editor's typed text to the value committed.
   * @defaultValue the text itself
   */
  readonly parse?: ((input: string) => unknown) | undefined;
  /**
   * A value to text: a `'text'` editor's starting text, and an edited cell's
   * content until the caller's `rows` catch up.
   * @defaultValue locale-formatted numbers and dates, an option's label, else `String(value)`
   */
  readonly format?: ((value: unknown) => string) | undefined;
}

/** How a `DataGrid` takes edits: not at all, one cell at a time, or collected for one save. */
export type TableEditing = 'none' | 'cell' | 'batch';

/** One committed edit: which cell, and what it held before and after. */
export interface CellChange<T> {
  /** The edited row's `rowKey`. */
  readonly rowKey: string;
  /** The edited column's `key`. */
  readonly column: string;
  /** The row as the caller supplied it, before the edit. */
  readonly row: T;
  /** The column's `editValue` for the row before the edit. */
  readonly from: unknown;
  /** The committed value. */
  readonly to: unknown;
}

/** What a snippet editor is handed. */
export interface CellEditorContext<T> {
  /** The value being edited — the draft, once `update` has been called. */
  readonly value: unknown;
  /** The row being edited. */
  readonly row: T;
  /** Replace the draft, which Enter or Tab then commits. */
  readonly update: (value: unknown) => void;
  /** Commit, and leave focus on the cell; with an argument, commit that value. */
  readonly commit: (value?: unknown) => void;
  /** Discard the draft and leave focus on the cell. */
  readonly cancel: () => void;
  /**
   * The wiring to spread on the control: its `id`, `labelId` (the column
   * header, for `aria-labelledby`), and the cell's error description.
   */
  readonly control: FieldControl;
}

/**
 * A cell's editor: a field primitive (`TextInput`, `NumberField`, `Select`,
 * `Checkbox`, `DateField`) by name, or a snippet. A `'checkbox'` cell has no
 * edit mode — its box is in the cell, and Space toggles and commits it.
 */
export type CellEditor<T> =
  | 'text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | Snippet<[CellEditorContext<T>]>;

/** One cell in error, as the error summary lists it. */
export interface CellError<T> {
  readonly row: T;
  readonly column: TableColumn<T>;
  readonly message: string;
}

/**
 * How a table lets the reader pick rows. `'multiple'` adds a checkbox column
 * with a select-all header; `'single'` a radio column; `'none'` neither.
 */
export type TableSelection = 'none' | 'single' | 'multiple';

/** What `Table`'s `bulkActions` snippet is handed while rows are selected. */
export interface TableBulkActions {
  /** The selected row keys, on every page. */
  readonly selected: ReadonlySet<string>;
  /** Empties the selection. */
  readonly clear: () => void;
}

/**
 * The row-selection and column-visibility props `Table` takes and `DataGrid`
 * passes through — declared once so the two cannot drift.
 */
export interface TableChoiceProps<T> {
  /**
   * Let the reader pick rows: a checkbox column (`'multiple'`) or a radio
   * column (`'single'`).
   * @defaultValue `'none'`
   */
  selection?: TableSelection | undefined;
  /**
   * The selected rows' `rowKey`s, on every page. Bindable.
   * @defaultValue an empty set
   */
  selected?: Set<string> | undefined;
  /** Called with the new selection whenever the reader changes it. */
  onSelectionChange?: ((selected: Set<string>) => void) | undefined;
  /**
   * Accessible name of a row's checkbox or radio.
   * @defaultValue `"Select <first column's value>"`
   */
  selectRowLabel?: ((row: T) => string) | undefined;
  /**
   * Accessible name of the select-all checkbox.
   * @defaultValue `'Select all on this page'`
   */
  selectAllLabel?: string | undefined;
  /**
   * The selection column's header text (screen readers only) in `'single'` mode.
   * @defaultValue `'Select'`
   */
  selectColumnLabel?: string | undefined;
  /** Bulk actions shown while anything is selected — `ToolbarButton`s. */
  bulkActions?: Snippet<[TableBulkActions]> | undefined;
  /**
   * The count shown, announced and naming the bulk-action toolbar.
   * @defaultValue `"<n> selected"`
   */
  selectedCountLabel?: ((count: number) => string) | undefined;
  /**
   * The `key`s of the columns not drawn. Bindable; the caller persists it.
   * @defaultValue the columns marked `defaultHidden`
   */
  hiddenColumns?: Set<string> | undefined;
  /** Offer the reader a "Columns" menu to hide and show columns. */
  columnMenu?: boolean | undefined;
  /**
   * The columns menu's trigger text and accessible name.
   * @defaultValue `'Columns'`
   */
  columnMenuLabel?: string | undefined;
}

/** What `Table`'s `rowAttributes` may set on a body row's `<tr>`. */
export interface TableRowAttributes {
  /** Classes merged onto the row (bold a changed or selected row). */
  readonly class?: string | undefined;
  /** The row's `id`, an anchor target (`#element-26`). */
  readonly id?: string | undefined;
}

/**
 * Which column a table is sorted by, and which way.
 *
 * Unsorted is `undefined`, not a `SortState` with an empty key: "no column"
 * is the absence of a sort, and modelling it as a sentinel key means every
 * reader of the state has to know the sentinel.
 */
export interface SortState {
  /** The `key` of the sorted {@link TableColumn}. */
  readonly key: string;
  readonly direction: 'asc' | 'desc';
}

/**
 * The next state in the three-step cycle a sortable header runs:
 * unsorted → ascending → descending → unsorted.
 *
 * A pure function rather than a method on the component so `DataGrid` and a
 * server-sorted caller cycle identically, and so the cycle is unit-testable
 * without a DOM.
 */
export function nextSortState(current: SortState | undefined, key: string): SortState | undefined {
  if (current === undefined || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return undefined;
}

/** What a column's `<th>` announces in `aria-sort`. */
export function columnAriaSort(
  sort: SortState | undefined,
  key: string,
): 'ascending' | 'descending' | 'none' {
  if (sort === undefined || sort.key !== key) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

/**
 * Whether the reader may hide the column at `index`: never the first, which
 * names the row, and otherwise unless the column says `hideable: false`.
 */
export function isColumnHideable<T>(column: TableColumn<T>, index: number): boolean {
  return index > 0 && column.hideable !== false;
}

/**
 * The hidden column keys a table starts from when the caller has not bound
 * `hiddenColumns`: those declared `defaultHidden` that may be hidden at all.
 */
export function defaultHiddenColumns<T>(columns: readonly TableColumn<T>[]): Set<string> {
  return new Set(
    columns
      .filter((column, index) => column.defaultHidden === true && isColumnHideable(column, index))
      .map((column) => column.key),
  );
}

/**
 * How much of the page in hand is selected — what the tri-state select-all
 * header shows. An empty page reads `'none'`.
 */
export function pageSelectionState(
  selected: ReadonlySet<string>,
  pageKeys: readonly string[],
): 'none' | 'some' | 'all' {
  const count = pageKeys.filter((key) => selected.has(key)).length;
  if (count === 0) return 'none';
  return count === pageKeys.length ? 'all' : 'some';
}

/**
 * `selected` with every key in `keys` added (`include`) or removed. Rows
 * outside `keys` keep their state, so selecting on page 2 never drops page 1.
 * Always a new `Set`, so a bound caller sees the change.
 */
export function withKeys(
  selected: ReadonlySet<string>,
  keys: readonly string[],
  include: boolean,
): Set<string> {
  const next = new Set(selected);
  for (const key of keys) {
    if (include) next.add(key);
    else next.delete(key);
  }
  return next;
}
