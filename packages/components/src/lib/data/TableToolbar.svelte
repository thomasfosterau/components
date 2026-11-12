<!-- @component
The bar above a `Table`: the selection count, the bulk actions while rows are selected, and the "Columns" menu.
-->
<!--
  TableToolbar — `Table`'s own header bar, not a public component: `Table`
  renders it when it has a selection mode or a columns menu, and passes it
  everything it shows.

  ARIA contract:
  - The count ("3 selected") is a `role="status"` paragraph — a polite live
    region — that is in the DOM for as long as the table is selectable, empty
    while nothing is, so the first selection is announced. A live region
    inserted with its text already in it is announced by nothing.
  - The bulk actions are a `ui/Toolbar` (`role="toolbar"`, one Tab stop,
    arrow keys within) named by the same count text, shown only while
    something is selected. The caller renders `ToolbarButton`s into it.
  - The columns menu is a `ui/DropdownMenu` of `MenuCheckboxItem`s
    (`menu` / `menuitemcheckbox`). Its trigger sits outside the toolbar: it
    is there whether or not anything is selected, and a toolbar that
    appears and disappears around it would move the reader's Tab stop.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import MenuCheckboxItem from '../ui/MenuCheckboxItem.svelte';
  import Toolbar from '../ui/Toolbar.svelte';
  import type { TableBulkActions } from './table-types.ts';
  import type { ColumnChoice } from './table-view.ts';

  interface Props {
    /** Show the selection count and, while it is non-zero, the bulk actions. */
    selectable: boolean;
    /** The selected row keys. */
    selected: ReadonlySet<string>;
    /** Empties the selection. */
    clear: () => void;
    /** The bulk-action controls. */
    bulkActions?: Snippet<[TableBulkActions]> | undefined;
    /** The count text, which also names the toolbar. */
    selectedCountLabel: (count: number) => string;
    /** Every column, for the columns menu; empty for no menu. */
    columnChoices: readonly ColumnChoice[];
    /** The columns menu trigger's text and the menu's accessible name. */
    columnMenuLabel: string;
    /** Called when the reader shows or hides a column. */
    onColumnToggle: (key: string, visible: boolean) => void;
  }

  let {
    selectable,
    selected,
    clear,
    bulkActions,
    selectedCountLabel,
    columnChoices,
    columnMenuLabel,
    onColumnToggle,
  }: Props = $props();

  const count = $derived(selected.size);
  const countText = $derived(count > 0 ? selectedCountLabel(count) : '');
</script>

<div class="mb-2 flex min-h-8 flex-wrap items-center gap-2">
  {#if selectable}
    <p role="status" class="text-sm font-medium tabular-nums">{countText}</p>
    {#if count > 0 && bulkActions}
      <Toolbar label={countText}>
        {@render bulkActions({ selected, clear })}
      </Toolbar>
    {/if}
  {/if}
  {#if columnChoices.length > 0}
    <div class="ms-auto">
      <DropdownMenu label={columnMenuLabel}>
        {#snippet trigger({ props })}
          <button {...props} type="button" class="btn btn-ghost btn-sm">{columnMenuLabel}</button>
        {/snippet}
        {#each columnChoices as choice (choice.key)}
          <MenuCheckboxItem
            checked={choice.visible}
            disabled={!choice.hideable}
            onCheckedChange={(visible) => {
              onColumnToggle(choice.key, visible);
            }}
          >
            {choice.header}
          </MenuCheckboxItem>
        {/each}
      </DropdownMenu>
    </div>
  {/if}
</div>
