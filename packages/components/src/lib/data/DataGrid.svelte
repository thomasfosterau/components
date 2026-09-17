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
  import Pagination from './Pagination.svelte';
  import Table from './Table.svelte';
  import type { SortState, TableColumn } from './table-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    rows: readonly T[];
    columns: readonly TableColumn<T>[];
    /** Stable identity per row — the `{#each}` key. */
    rowKey: (row: T) => string;
    /** Offer the filter box. */
    filterable?: boolean | undefined;
    /** Offer the pager; every row renders when false. */
    paginated?: boolean | undefined;
    pageSize?: number | undefined;
    pageSizeOptions?: readonly number[] | undefined;
    /** The table's accessible name, rendered as its `<caption>`. */
    caption?: string | undefined;
    captionHidden?: boolean | undefined;
    size?: Size | undefined;
    zebra?: boolean | undefined;
    pinRows?: boolean | undefined;
    /** Which column starts sorted. Bindable; `undefined` is the caller's order. */
    sort?: SortState | undefined;
    /** Makes every row activatable by pointer and keyboard; see `Table`. */
    onSelect?: ((row: T) => void) | undefined;
    emptyMessage?: string | undefined;
    emptyState?: Snippet<[]> | undefined;
    filterLabel?: string | undefined;
    filterPlaceholder?: string | undefined;
    rowsPerPageLabel?: string | undefined;
    showingLabel?: ((start: number, end: number, total: number) => string) | undefined;
    pageOfLabel?: ((page: number, pages: number) => string) | undefined;
    previousLabel?: string | undefined;
    nextLabel?: string | undefined;
    paginationLabel?: string | undefined;
    sortLabel?: ((column: TableColumn<T>) => string) | undefined;
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
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

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
    {emptyMessage}
    {emptyState}
    {sortLabel}
    bind:sort
    onSort={() => {
      // A new sort re-orders the whole result, so the reader's place in the
      // old order means nothing; page 1 is the only honest answer.
      page = 0;
    }}
  />

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
