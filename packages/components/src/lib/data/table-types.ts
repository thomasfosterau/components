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
