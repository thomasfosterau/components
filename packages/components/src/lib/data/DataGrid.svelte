<!-- @component
A `Table` with client-side sorting, filtering across every column and paging, for a list that is already entirely in hand — and, with `editing`, an APG grid of editable cells.
-->
<!--
  DataGrid — the three controls a reader wants over a list that is already
  entirely in hand: sort a column, filter across every column, page through
  the result.

  It draws no table of its own. The rows go through `Table` and the pager
  through `Pagination`, so the cell markup, the empty state, the sort control
  and the disabled-arm rule all have exactly one implementation, and this file
  is the decisions rather than the markup.

  **Client-side, and that is the constraint.** Every derivation below runs
  over the whole `rows` array on every keystroke, so this is for a bounded set
  the page already holds — a vocabulary, an account's devices, a taxon's
  synonyms. A collection the API pages belongs on `Table` + `PaginationFooter`,
  where the server does the work; pointing this at one would silently sort and
  filter the current page only, which reads as data loss rather than as a
  limitation.

  Selection and hidden columns are `Table`'s, passed straight through.
  Selections are keyed by `rowKey`, so they survive a sort, a filter and a
  page change; the select-all header covers the page on screen.

  Editing (`editing="cell" | "batch"`) swaps `Table` for `EditableGrid`, the
  same table as an APG Grid with one Tab stop and editable cells; its
  header has the keyboard and ARIA contract. Columns opt in with
  `editable`, and edit with the `fields/` primitive their `editor` names.
  `'cell'` hands each commit to `onCellCommit` (reject to roll it back);
  `'batch'` collects them in the bindable `changes` for one save. Either
  way the caller's `rows` stay the truth: an edit is shown over them until
  its save settles (cell) or until the caller clears `changes` (batch).
  `onSelect` does not apply to an editing grid — a row cannot be both a
  button and a row of cells.

  ARIA contract: the `Table`'s and the `Pagination`'s. The filter is a
  `<input type="search">` with a real label (visually hidden, because the
  control sits in a toolbar where a visible label would be the only one), and
  the rows-per-page `<select>` is named by `rowsPerPageLabel`.
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import type { Size } from '../ui/tones.ts';
  import EditableGrid from './EditableGrid.svelte';
  import Pagination from './Pagination.svelte';
  import Table from './Table.svelte';
  import type {
    CellChange,
    CellError,
    SortState,
    TableChoiceProps,
    TableColumn,
    TableEditing,
    TableRowAttributes,
  } from './table-types.ts';

  /** `Table`'s selection and column props, passed through; `selected` and `hiddenColumns` bind. */
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, TableChoiceProps<T> {
    /** Every row; sorting, filtering and paging happen here. */
    rows: readonly T[];
    /** Column definitions: header, cell renderer, sort key. */
    columns: readonly TableColumn<T>[];
    /** Stable identity per row — the `{#each}` key. */
    rowKey: (row: T) => string;
    /** Offer the filter box. */
    filterable?: boolean | undefined;
    /**
     * Offer the pager; every row renders when false.
     * @defaultValue `true`
     */
    paginated?: boolean | undefined;
    /**
     * Rows per page until the reader picks another size.
     * @defaultValue `10`
     */
    pageSize?: number | undefined;
    /**
     * The choices offered in the rows-per-page select.
     * @defaultValue `[10, 25, 50, 100]`
     */
    pageSizeOptions?: readonly number[] | undefined;
    /** The table's accessible name, rendered as its `<caption>`. */
    caption?: string | undefined;
    /** Keep the caption for assistive technology only. */
    captionHidden?: boolean | undefined;
    /** daisyUI size step. */
    size?: Size | undefined;
    /** Stripe alternate rows. */
    zebra?: boolean | undefined;
    /** Stick the header row while the body scrolls; see `Table`. */
    pinRows?: boolean | undefined;
    /** Which column starts sorted. Bindable; `undefined` is the caller's order. */
    sort?: SortState | undefined;
    /** Makes every row activatable by pointer and keyboard; see `Table`. */
    onSelect?: ((row: T) => void) | undefined;
    /** A body row's own `class` and `id`; see `Table`. */
    rowAttributes?: ((row: T) => TableRowAttributes) | undefined;
    /** The line shown when no row matches. */
    emptyMessage?: string | undefined;
    /** Richer empty state, in place of `emptyMessage`. */
    emptyState?: Snippet<[]> | undefined;
    /**
     * Accessible name of the filter box.
     * @defaultValue `'Search'`
     */
    filterLabel?: string | undefined;
    /**
     * Placeholder in the filter box.
     * @defaultValue `'Search…'`
     */
    filterPlaceholder?: string | undefined;
    /**
     * Label of the rows-per-page select.
     * @defaultValue `'Rows per page'`
     */
    rowsPerPageLabel?: string | undefined;
    /**
     * The range line under the table.
     * @defaultValue `"Showing <start> to <end> of <total>"`
     */
    showingLabel?: ((start: number, end: number, total: number) => string) | undefined;
    /**
     * The page status between the pager arms.
     * @defaultValue `"Page <page> of <pages>"`
     */
    pageOfLabel?: ((page: number, pages: number) => string) | undefined;
    /**
     * Text of the previous-page control.
     * @defaultValue `'Previous'`
     */
    previousLabel?: string | undefined;
    /**
     * Text of the next-page control.
     * @defaultValue `'Next'`
     */
    nextLabel?: string | undefined;
    /**
     * Accessible name of the pager landmark.
     * @defaultValue `'Pagination'`
     */
    paginationLabel?: string | undefined;
    /** How a sortable column’s button is named; see `Table`. */
    sortLabel?: ((column: TableColumn<T>) => string) | undefined;
    /**
     * Let the reader edit the cells of columns marked `editable`: each commit
     * saved on its own (`'cell'`), or collected in `changes` (`'batch'`). Any
     * value but `'none'` makes the table an APG grid.
     * @defaultValue `'none'`
     */
    editing?: TableEditing | undefined;
    /**
     * `'cell'` mode: persist one commit. Resolve once the caller's `rows`
     * hold the new value; reject (with an `Error` whose message says why) to
     * roll the cell back. The signal aborts when the cell is edited again.
     */
    onCellCommit?: ((change: CellChange<T>, signal: AbortSignal) => Promise<void>) | undefined;
    /**
     * `'batch'` mode: the edits not yet saved, one per cell. Bindable; the
     * caller saves them, updates `rows` and empties it.
     * @defaultValue `[]`
     */
    changes?: CellChange<T>[] | undefined;
    /**
     * An editing grid's description: how to start editing.
     * @defaultValue `'Press Enter or F2 to edit a cell, Escape to cancel.'`
     */
    editHintLabel?: string | undefined;
    /**
     * The error summary's count line, a polite live region.
     * @defaultValue `"<n> cells have errors"`
     */
    errorsLabel?: ((count: number) => string) | undefined;
    /**
     * One entry of the error summary, which focuses its cell.
     * @defaultValue `"<first column's value>, <header>: <message>"`
     */
    cellErrorLabel?: ((error: CellError<T>) => string) | undefined;
    /**
     * What is announced when `onCellCommit` rejects.
     * @defaultValue `"<header> for <first column's value> was not saved: <message>"`
     */
    commitErrorLabel?: ((error: CellError<T>) => string) | undefined;
    /**
     * A rejection's message when it carries none.
     * @defaultValue `'The change could not be saved.'`
     */
    saveFailedLabel?: string | undefined;
    /**
     * How a changed cell is described in `'batch'` mode.
     * @defaultValue `'Changed'`
     */
    changedLabel?: string | undefined;
    /**
     * Locale(s) for `Intl` formatting.
     * @defaultValue the components context's `locale()`
     */
    locales?: string | readonly string[] | undefined;
  }

  let {
    rows,
    columns,
    rowKey,
    filterable = false,
    paginated = true,
    pageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    caption,
    captionHidden,
    size,
    zebra,
    pinRows,
    sort = $bindable(undefined),
    onSelect,
    rowAttributes,
    emptyMessage,
    emptyState,
    filterLabel = 'Search',
    filterPlaceholder = 'Search…',
    rowsPerPageLabel = 'Rows per page',
    showingLabel = (start, end, total) => `Showing ${start} to ${end} of ${total}`,
    pageOfLabel = (page, pages) => `Page ${page} of ${pages}`,
    previousLabel = 'Previous',
    nextLabel = 'Next',
    paginationLabel = 'Pagination',
    sortLabel,
    selection,
    selected = $bindable(new Set<string>()),
    onSelectionChange,
    selectRowLabel,
    selectAllLabel,
    selectColumnLabel,
    bulkActions,
    selectedCountLabel,
    hiddenColumns = $bindable(undefined),
    columnMenu,
    columnMenuLabel,
    editing = 'none',
    onCellCommit,
    changes = $bindable([]),
    editHintLabel = 'Press Enter or F2 to edit a cell, Escape to cancel.',
    errorsLabel = (count) => (count === 1 ? '1 cell has an error' : `${count} cells have errors`),
    cellErrorLabel = (error) => `${rowName(error.row)}, ${error.column.header}: ${error.message}`,
    commitErrorLabel = (error) =>
      `${error.column.header} for ${rowName(error.row)} was not saved: ${error.message}`,
    saveFailedLabel = 'The change could not be saved.',
    changedLabel = 'Changed',
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

  /** What names a row in an error message: its first column's value. */
  function rowName(row: T): string {
    return columns[0] === undefined ? '' : String(columns[0].value(row));
  }

  let filter = $state('');
  // 0 is "the reader has not chosen": the `pageSize` prop stays authoritative
  // until they pick from the menu, so a page that changes the prop is honoured
  // rather than overridden by state seeded once at mount.
  let chosenSize = $state(0);
  let page = $state(0);

  const limit = $derived(chosenSize === 0 ? pageSize : chosenSize);

  const filtered = $derived.by(() => {
    const needle = filter.trim().toLowerCase();
    if (needle === '') return rows;
    // The filter searches the column's VALUE, not its rendered cell: a cell
    // may be a badge or a link, and a reader typing what they can see is
    // typing the value either way.
    return rows.filter((row) =>
      columns.some((column) => String(column.value(row)).toLowerCase().includes(needle)),
    );
  });

  const sorted = $derived.by(() => {
    const active = sort;
    if (active === undefined) return filtered;
    const column = columns.find((candidate) => candidate.key === active.key);
    if (column === undefined) return filtered;
    const direction = active.direction === 'asc' ? 1 : -1;
    // `localeCompare` in the active locale, so a Swedish reader gets Swedish
    // collation rather than code-point order; numbers compare numerically,
    // because "10" sorts before "9" as a string and that is always wrong.
    return filtered.toSorted((left, right) => {
      const a = column.value(left);
      const b = column.value(right);
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction;
      return String(a).localeCompare(String(b), locales) * direction;
    });
  });

  const total = $derived(sorted.length);
  const pageCount = $derived(paginated ? Math.max(1, Math.ceil(total / limit)) : 1);
  // A filter that shrinks the result out from under the current page would
  // otherwise leave the reader looking at an empty body with rows they cannot
  // reach. Clamping in a derivation rather than in the filter's handler keeps
  // it true however the page count changed — including a `rows` prop that
  // shrank without anyone typing.
  const current = $derived(Math.min(page, pageCount - 1));
  const visible = $derived(
    paginated ? sorted.slice(current * limit, current * limit + limit) : sorted,
  );
  const from = $derived(total === 0 ? 0 : current * limit + 1);
  const to = $derived(Math.min((current + 1) * limit, total));

  /** Bring a row on screen for the error summary: past the filter, onto its page. */
  function reveal(row: T): void {
    const key = rowKey(row);
    const indexOf = (): number => sorted.findIndex((candidate) => rowKey(candidate) === key);
    if (indexOf() === -1) filter = '';
    const index = indexOf();
    if (paginated && index !== -1) page = Math.floor(index / limit);
  }

  /** A new sort re-orders the whole result, so the reader's place in the old order means nothing. */
  const resetPage = (): void => {
    page = 0;
  };
</script>

<div {...rest} class={['space-y-3', className]}>
  {#if filterable}
    <label class="input input-sm w-full max-w-xs">
      <span class="sr-only">{filterLabel}</span>
      <input
        type="search"
        bind:value={filter}
        oninput={() => {
          page = 0;
        }}
        placeholder={filterPlaceholder}
        aria-label={filterLabel}
      />
    </label>
  {/if}

  {#if editing === 'none'}
    <Table
      rows={visible}
      {columns}
      {rowKey}
      {caption}
      {captionHidden}
      {size}
      {zebra}
      {pinRows}
      {onSelect}
      {rowAttributes}
      {emptyMessage}
      {emptyState}
      {sortLabel}
      {selection}
      {onSelectionChange}
      {selectRowLabel}
      {selectAllLabel}
      {selectColumnLabel}
      {bulkActions}
      {selectedCountLabel}
      {columnMenu}
      {columnMenuLabel}
      bind:selected
      bind:hiddenColumns
      bind:sort
      onSort={resetPage}
    />
  {:else}
    <EditableGrid
      rows={visible}
      allRows={rows}
      {columns}
      {rowKey}
      {editing}
      {onCellCommit}
      rowCount={total}
      rowOffset={paginated ? current * limit : 0}
      pageStep={paginated ? limit : 10}
      onReveal={reveal}
      {caption}
      {captionHidden}
      {size}
      {zebra}
      {pinRows}
      {rowAttributes}
      {emptyMessage}
      {emptyState}
      {sortLabel}
      {locales}
      {editHintLabel}
      {errorsLabel}
      {cellErrorLabel}
      {commitErrorLabel}
      {saveFailedLabel}
      {changedLabel}
      {selection}
      {onSelectionChange}
      {selectRowLabel}
      {selectAllLabel}
      {selectColumnLabel}
      {bulkActions}
      {selectedCountLabel}
      {columnMenu}
      {columnMenuLabel}
      bind:changes
      bind:selected
      bind:hiddenColumns
      bind:sort
      onSort={resetPage}
    />
  {/if}

  {#if paginated && total > 0}
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <p class="text-base-content/70 text-sm tabular-nums">{showingLabel(from, to, total)}</p>
        <select
          class="select select-sm w-auto"
          aria-label={rowsPerPageLabel}
          value={limit}
          onchange={(event) => {
            chosenSize = Number(event.currentTarget.value);
            page = 0;
          }}
        >
          {#each pageSizeOptions as option (option)}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>
      <Pagination
        offset={current * limit}
        {limit}
        {total}
        variant="prevNext"
        label={paginationLabel}
        {previousLabel}
        {nextLabel}
        statusLabel={pageOfLabel}
        onPage={(offset) => {
          page = Math.floor(offset / limit);
        }}
      />
    </div>
  {/if}
</div>
