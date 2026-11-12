<!-- @component
A daisyUI `table` from column definitions and rows, with optional sortable headers, activatable rows, row selection and reader-hideable columns.
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

  Selection (`selection="multiple" | "single"`) adds a first column of native
  inputs: a checkbox per row with a tri-state select-all checkbox in the
  header, or a radio per row sharing one `name` per table. The table stays a
  `<table>` — this component has no `role="grid"` to extend, so there is no
  `aria-selected`: the input's checked state IS the selection's semantics,
  each input is an ordinary Tab stop, Space toggles a checkbox and the arrow
  keys move a radio group, as natively. Select-all covers the rows in hand
  (the current page) and never touches a selected key that is not on it. A
  selected row also takes `bg-base-200`, never colour alone. Activation and
  selection never share a gesture: the selection cell stops its clicks and
  keys from reaching an activatable row's handler, and activating a row
  selects nothing. (An activatable row is `role="button"`, whose children
  are presentational, so a table that wants both reads better with a link in
  a cell than with `onSelect`.)

  `hiddenColumns` removes a column's `<th>` and `<td>`s — not CSS — so a
  screen reader's column count is the one on screen; `columnMenu` offers it
  to the reader as a `menu` of `menuitemcheckbox`es. The first column names
  the row and is never hidden. The count, the bulk actions and the menu live
  in `TableToolbar` (see its header).

  The empty state is not an optional nicety: a table body with no rows and no
  explanation reads as broken, and only the caller knows whether "nothing"
  means "none yet" or "none matched".
-->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, HTMLTableAttributes } from 'svelte/elements';
  import type { Size } from '../ui/tones.ts';
  import ColumnHeading from './ColumnHeading.svelte';
  import TableSelect from './TableSelect.svelte';
  import TableToolbar from './TableToolbar.svelte';
  import { columnClass, tableSize } from './table-classes.ts';
  import { choiceLabels, columnView, sortIndicator } from './table-view.ts';
  import {
    columnAriaSort,
    nextSortState,
    pageSelectionState,
    withKeys,
    type SortState,
    type TableChoiceProps,
    type TableColumn,
    type TableRowAttributes,
  } from './table-types.ts';

  interface Props extends Omit<HTMLTableAttributes, 'children'>, TableChoiceProps<T> {
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
    /** A body row's own `class` and `id`, merged with what `onSelect` adds. */
    rowAttributes?: ((row: T) => TableRowAttributes) | undefined;
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
    rowAttributes,
    emptyMessage = 'Nothing to show.',
    emptyState,
    foot,
    sortLabel = (column) => `Sort by ${column.header}`,
    containerClass,
    selection = 'none',
    selected = $bindable(new Set<string>()),
    onSelectionChange,
    selectRowLabel,
    selectAllLabel,
    selectColumnLabel,
    bulkActions,
    selectedCountLabel,
    hiddenColumns = $bindable(undefined),
    columnMenu = false,
    columnMenuLabel,
    class: className,
    ...rest
  }: Props = $props();

  const radioName = $props.id();

  const view = $derived(columnView(columns, hiddenColumns, columnMenu));
  const hidden = $derived(view.hidden);
  const shownColumns = $derived(view.shown);
  const labels = $derived(
    choiceLabels(
      { selectRowLabel, selectAllLabel, selectColumnLabel, selectedCountLabel, columnMenuLabel },
      columns,
    ),
  );
  const selectable = $derived(selection !== 'none');
  const pageKeys = $derived(rows.map((row) => rowKey(row)));
  const pageState = $derived(pageSelectionState(selected, pageKeys));

  const select = (next: Set<string>): void => {
    selected = next;
    onSelectionChange?.(next);
  };

  const toggleColumn = (key: string, visible: boolean): void => {
    hiddenColumns = withKeys(hidden, [key], !visible);
  };

  /**
   * Keeps the selection cell's clicks and keys from the row: a row that is
   * activatable would otherwise open when the reader only meant to include it.
   */
  const isolate = (event: Event): void => {
    event.stopPropagation();
  };

  const toggleSort = (column: TableColumn<T>): void => {
    const next = nextSortState(sort, column.key);
    sort = next;
    onSort?.(next);
  };

  /**
   * Everything an activatable row needs, as one spread — or nothing at all
   * when it is not activatable. Assembled here rather than as four attribute
   * ternaries in the markup, because those four have to agree with each other
   * (a `role` without a `tabindex` is a lie) and one object is where that
   * agreement is visible.
   */
  const activation = (row: T): HTMLAttributes<HTMLTableRowElement> =>
    onSelect === undefined
      ? {}
      : {
          role: 'button',
          tabindex: 0,
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

{#snippet selectHeader()}
  <th scope="col" class="w-0">
    <TableSelect
      header
      selection={selection === 'single' ? 'single' : 'multiple'}
      label={selection === 'single' ? labels.selectColumnLabel : labels.selectAllLabel}
      disabled={pageKeys.length === 0}
      checked={pageState === 'all'}
      indeterminate={pageState === 'some'}
      onToggle={(checked) => {
        select(withKeys(selected, pageKeys, checked));
      }}
    />
  </th>
{/snippet}

{#snippet selectCell(row: T, key: string)}
  <td class="w-0" onclick={isolate} onkeydown={isolate}>
    <TableSelect
      header={false}
      selection={selection === 'single' ? 'single' : 'multiple'}
      label={labels.selectRowLabel(row)}
      name={selection === 'single' ? radioName : undefined}
      value={selection === 'single' ? key : undefined}
      checked={selected.has(key)}
      onToggle={(checked) => {
        select(selection === 'single' ? new Set([key]) : withKeys(selected, [key], checked));
      }}
    />
  </td>
{/snippet}

{#snippet columnHeader(column: TableColumn<T>)}
  <th
    scope="col"
    class={[columnClass(column), column.headerClass]}
    aria-sort={column.sortable ? columnAriaSort(sort, column.key) : undefined}
  >
    <ColumnHeading
      sortable={column.sortable === true}
      header={column.header}
      label={sortLabel(column)}
      indicator={sortIndicator(sort, column.key)}
      onclick={() => {
        toggleSort(column);
      }}
    />
  </th>
{/snippet}

{#snippet bodyRow(row: T)}
  {@const own = rowAttributes?.(row)}
  {@const key = rowKey(row)}
  <tr
    {...activation(row)}
    id={own?.id}
    class={[
      'hover:bg-base-200',
      onSelect !== undefined && 'cursor-pointer',
      selectable && selected.has(key) && 'bg-base-200',
      own?.class,
    ]}
  >
    {#if selectable}{@render selectCell(row, key)}{/if}
    {#each shownColumns as column (column.key)}
      {#if column.rowHeader}
        <th scope="row" class={['font-normal', columnClass(column)]}>{@render cellBody(column, row)}</th>
      {:else}
        <td class={columnClass(column)}>{@render cellBody(column, row)}</td>
      {/if}
    {/each}
  </tr>
{/snippet}

{#snippet body()}
<tbody>
  {#if rows.length === 0}
    <tr>
      <!-- Without the colspan the message sits under the first column and
           the table looks like it lost its data rather than never had any. -->
      <td colspan={shownColumns.length + (selectable ? 1 : 0)} class="text-base-content/60 py-8 text-center">
        {#if emptyState}{@render emptyState()}{:else}{emptyMessage}{/if}
      </td>
    </tr>
  {:else}
    {#each rows as row (rowKey(row))}
      {@render bodyRow(row)}
    {/each}
  {/if}
</tbody>
{/snippet}

{#if selectable || columnMenu}
  <TableToolbar
    {selectable}
    {selected}
    clear={() => {
      select(new Set());
    }}
    {bulkActions}
    selectedCountLabel={labels.selectedCountLabel}
    columnChoices={view.choices}
    columnMenuLabel={labels.columnMenuLabel}
    onColumnToggle={toggleColumn}
  />
{/if}

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
        {#if selectable}{@render selectHeader()}{/if}
        {#each shownColumns as column (column.key)}
          {@render columnHeader(column)}
        {/each}
      </tr>
    </thead>
    {@render body()}
    {#if foot}
      <tfoot>
        <tr>{@render foot()}</tr>
      </tfoot>
    {/if}
  </table>
</div>
