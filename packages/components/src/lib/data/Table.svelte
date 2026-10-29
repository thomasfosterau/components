<!-- @component
A daisyUI `table` from column definitions and rows, with optional sortable headers and activatable rows.
-->
<!--
  Table — columns in, rows in, a daisyUI `table` out.

  It decides nothing about WHICH rows: a caller hands it the window it wants
  shown, in the order it wants it, and this draws the header, the body, the
  footer and the empty state. Sorting is the same deal — the header offers
  the control and announces the state, and the caller (or `DataGrid`) does
  the reordering. That split is what lets one component serve both a
  client-side grid over 40 rows and a server-paged listing over 40,000, where
  sorting the page in hand would be a lie.

  ARIA contract: a real `<table>` with `<th scope="col">` headers. `caption`
  is the table's accessible name — an unnamed table is one a screen-reader
  user cannot tell from the next one — and `captionHidden` keeps it for
  assistive technology only when the page's own heading already shows it. A
  sortable column's header is a real `<button>` inside the `<th>` (the
  activation), and the `<th>` carries `aria-sort` (the state); the arrow
  beside it is `aria-hidden`, because the sort must be announced by the state
  and not by a glyph.

  `onSelect` makes each row activatable with `role="button"`, `tabindex="0"`
  and Enter/Space — a click handler on a bare `<tr>` is invisible to everyone
  not using a mouse. It costs the row its `row` semantics, so prefer a link
  or a button inside a cell where the row's structure matters, and keep this
  for a grid whose whole row is one destination.

  The empty state is not an optional nicety: a table body with no rows and no
  explanation reads as broken, and only the caller knows whether "nothing"
  means "none yet" or "none matched".
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, HTMLTableAttributes } from 'svelte/elements';
  import type { Size } from '../ui/tones.ts';
  import { columnAriaSort, nextSortState, type SortState, type TableColumn } from './table-types.ts';

  interface Props extends Omit<HTMLTableAttributes, 'children'> {
    /** The rows to draw, in the order to draw them. */
    rows: readonly T[];
    /** Column definitions: header, cell renderer, sort key. */
    columns: readonly TableColumn<T>[];
    /** Stable identity per row — the `{#each}` key. */
    rowKey: (row: T) => string;
    /** The table's accessible name, rendered as its `<caption>`. */
    caption?: string | undefined;
    /** Keep the caption for assistive technology only. */
    captionHidden?: boolean | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** Stripe alternate rows. */
    zebra?: boolean | undefined;
    /**
     * Stick the header row while the body scrolls. Needs the scroll container
     * to be the scrolling element, so give it a `max-h-*` through `class`
     * when the page itself should not scroll.
     */
    pinRows?: boolean | undefined;
    /** Which column is sorted, and which way. Bindable; `undefined` is unsorted. */
    sort?: SortState | undefined;
    /** Called with the next state when a sortable header is activated. */
    onSort?: ((sort: SortState | undefined) => void) | undefined;
    /** Makes every row activatable by pointer and keyboard. */
    onSelect?: ((row: T) => void) | undefined;
    /**
     * The line shown instead of an empty body.
     * @defaultValue `'Nothing to show.'`
     */
    emptyMessage?: string | undefined;
    /** Richer empty state, in place of `emptyMessage`. */
    emptyState?: Snippet<[]> | undefined;
    /** A `<tfoot>` row — totals, or a summary. Render `<td>`/`<th>` cells. */
    foot?: Snippet<[]> | undefined;
    /**
     * How a sortable column's button is named.
     * @defaultValue `"Sort by <header>"`
     */
    sortLabel?: ((column: TableColumn<T>) => string) | undefined;
    /** Classes on the scroll container the table sits in. */
    containerClass?: string | undefined;
  }

  let {
    rows,
    columns,
    rowKey,
    caption,
    captionHidden = false,
    size = 'md',
    zebra = false,
    pinRows = false,
    sort = $bindable(undefined),
    onSort,
    onSelect,
    emptyMessage = 'Nothing to show.',
    emptyState,
    foot,
    sortLabel = (column) => `Sort by ${column.header}`,
    containerClass,
    class: className,
    ...rest
  }: Props = $props();

  const tableSize: Record<Size, string> = {
    xs: 'table-xs',
    sm: 'table-sm',
    md: 'table-md',
    lg: 'table-lg',
    xl: 'table-xl',
  };

  /** Alignment and the column's own classes, shared by its `<th>` and `<td>`. */
  const columnClass = (column: TableColumn<T>): (string | false | undefined)[] => [
    column.align === 'end' ? 'text-end' : 'text-start',
    column.class,
  ];

  const toggleSort = (column: TableColumn<T>): void => {
    const next = nextSortState(sort, column.key);
    sort = next;
    onSort?.(next);
  };

  /** The arrow beside a sorted header. Decorative — `aria-sort` is the state. */
  const sortIndicator = (key: string): string => {
    if (sort === undefined || sort.key !== key) return '';
    return sort.direction === 'asc' ? '▲' : '▼';
  };

  /**
   * Everything an activatable row needs, as one spread — or nothing at all
   * when it is not activatable. Assembled here rather than as four attribute
   * ternaries in the markup, because those four have to agree with each other
   * (a `role` without a `tabindex` is a lie) and one object is where that
   * agreement is visible.
   */
  const rowAttributes = (row: T): HTMLAttributes<HTMLTableRowElement> =>
    onSelect === undefined
      ? {}
      : {
          role: 'button',
          tabindex: 0,
          class: 'cursor-pointer',
          onclick: () => {
            onSelect(row);
          },
          onkeydown: (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            // Space scrolls the page and Enter can submit a wrapping form;
            // an activation that also does one of those is a bug report.
            event.preventDefault();
            onSelect(row);
          },
        };
</script>

{#snippet cellBody(column: TableColumn<T>, row: T)}
  {#if column.cell}{@render column.cell(row)}{:else}{column.value(row)}{/if}
{/snippet}

<div class={['overflow-x-auto', containerClass]}>
  <table
    {...rest}
    class={[
      'table bg-base-100',
      tableSize[size],
      zebra && 'table-zebra',
      pinRows && 'table-pin-rows',
      className,
    ]}
  >
    {#if caption !== undefined}
      <caption class={captionHidden ? 'sr-only' : 'p-3 text-start text-sm font-medium'}>
        {caption}
      </caption>
    {/if}
    <thead>
      <tr>
        {#each columns as column (column.key)}
          <th scope="col" class={columnClass(column)} aria-sort={column.sortable ? columnAriaSort(sort, column.key) : undefined}>
            {#if column.sortable}
              <button
                type="button"
                class="link link-hover inline-flex items-center gap-1"
                onclick={() => {
                  toggleSort(column);
                }}
                aria-label={sortLabel(column)}
              >
                {column.header}
                <span aria-hidden="true" class="text-xs">{sortIndicator(column.key)}</span>
              </button>
            {:else}
              {column.header}
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr>
          <!-- Without the colspan the message sits under the first column and
               the table looks like it lost its data rather than never had any. -->
          <td colspan={columns.length} class="text-base-content/60 py-8 text-center">
            {#if emptyState}{@render emptyState()}{:else}{emptyMessage}{/if}
          </td>
        </tr>
      {:else}
        {#each rows as row (rowKey(row))}
          <tr class="hover:bg-base-200" {...rowAttributes(row)}>
            {#each columns as column (column.key)}
              {#if column.rowHeader}
                <th scope="row" class={['font-normal', columnClass(column)]}>{@render cellBody(column, row)}</th>
              {:else}
                <td class={columnClass(column)}>{@render cellBody(column, row)}</td>
              {/if}
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
    {#if foot}
      <tfoot>
        <tr>{@render foot()}</tr>
      </tfoot>
    {/if}
  </table>
</div>
