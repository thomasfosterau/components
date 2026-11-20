<!-- @component
Two lists side by side, the available options and the chosen ones, with buttons and keys to move options between them and, optionally, to order the chosen ones.
-->
<!--
  Built on two multiple `Listbox`es, whose highlighted options are what the
  buttons move. Enter moves the highlighted options to the other list and
  Alt+↑/↓ reorders them, both handled on the wrapper after the listbox has
  seen the key, so focus never leaves the source list.
-->
<script lang="ts">
  import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
  } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import {
    toFieldOptions,
    type FieldOption,
    type FieldOptionInput,
    type FieldSize,
  } from './field-types.ts';
  import TransferPane from './TransferPane.svelte';
  import { canShift, shiftPicked } from './transfer.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
    /** Every option, available or chosen; bare strings when value and label are the same. */
    options: readonly FieldOptionInput[];
    /**
     * The chosen values, in their chosen order. Bindable.
     * @defaultValue `[]`
     */
    value?: string[] | undefined;
    /** Called with the chosen values after every move or reorder. */
    onValueChange?: ((value: readonly string[]) => void) | undefined;
    /** Let the reader order the chosen values (Move up / Move down, Alt+↑/↓). */
    orderable?: boolean | undefined;
    /** Show a filter field above each list. */
    searchable?: boolean | undefined;
    /** A richer option body; the label is rendered when omitted. */
    option?: Snippet<[FieldOption, { selected: boolean }]> | undefined;
    /** Posts the chosen values under this name, one hidden input each, in order. */
    name?: string | undefined;
    /** The whole control is unavailable. */
    disabled?: boolean | undefined;
    /**
     * Rows visible in each list before it scrolls.
     * @defaultValue `8`
     */
    rows?: 4 | 6 | 8 | 10 | 12 | undefined;
    /**
     * daisyUI size step, for the option text.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * The heading of the list of options not yet chosen.
     * @defaultValue `'Available'`
     */
    availableLabel?: string | undefined;
    /**
     * The heading of the list of chosen options.
     * @defaultValue `'Selected'`
     */
    selectedLabel?: string | undefined;
    /**
     * Names the group of move buttons.
     * @defaultValue `'Transfer'`
     */
    transferLabel?: string | undefined;
    /** @defaultValue `'Add selected'` */
    addLabel?: string | undefined;
    /** @defaultValue `'Add all'` */
    addAllLabel?: string | undefined;
    /** @defaultValue `'Remove selected'` */
    removeLabel?: string | undefined;
    /** @defaultValue `'Remove all'` */
    removeAllLabel?: string | undefined;
    /** @defaultValue `'Move up'` */
    moveUpLabel?: string | undefined;
    /** @defaultValue `'Move down'` */
    moveDownLabel?: string | undefined;
    /**
     * The filter field's accessible name, given the list's heading.
     * @defaultValue `` (list) => `Filter ${list}` ``
     */
    filterLabel?: ((list: string) => string) | undefined;
    /**
     * Announced after a move, given how many options moved and the heading
     * of the list they went to.
     * @defaultValue `` (count, to) => `${count} moved to ${to}` ``
     */
    movedLabel?: ((count: number, to: string) => string) | undefined;
    /**
     * Announced after a reorder, given how many options moved and which way.
     * @defaultValue `` (count, direction) => `${count} moved ${direction}` ``
     */
    reorderedLabel?: ((count: number, direction: 'up' | 'down') => string) | undefined;
    /**
     * Shown in a list with no options.
     * @defaultValue `'No options'`
     */
    emptyLabel?: string | undefined;
    /** `FieldControl`: the label's id; names the group through `aria-labelledby`. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error — sets the error border on both lists. */
    invalid?: boolean | undefined;
    /** `FieldControl`: marks the chosen list required. */
    required?: boolean | undefined;
  }

  let {
    options,
    value = $bindable([]),
    onValueChange,
    orderable = false,
    searchable = false,
    option,
    name,
    disabled = false,
    rows = 8,
    size = 'md',
    availableLabel = 'Available',
    selectedLabel = 'Selected',
    transferLabel = 'Transfer',
    addLabel = 'Add selected',
    addAllLabel = 'Add all',
    removeLabel = 'Remove selected',
    removeAllLabel = 'Remove all',
    moveUpLabel = 'Move up',
    moveDownLabel = 'Move down',
    filterLabel = (list) => `Filter ${list}`,
    movedLabel = (count, to) => `${count} moved to ${to}`,
    reorderedLabel = (count, direction) => `${count} moved ${direction}`,
    emptyLabel = 'No options',
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    id: idProp,
    class: className,
    ...rest
  }: Props = $props();

  const generatedId = $props.id();
  const id = $derived(idProp ?? generatedId);
  const availableId = $derived(`${id}-available`);
  const selectedId = $derived(`${id}-selected`);

  const all = $derived(toFieldOptions(options));
  const byValue = $derived(new Map(all.map((entry) => [entry.value, entry])));

  let availableFilter = $state('');
  let selectedFilter = $state('');
  /** The highlighted options in each list: what the buttons and Enter move. */
  let availablePicked: string[] = $state([]);
  let selectedPicked: string[] = $state([]);
  let announcement = $state('');

  const matches = (entry: FieldOption, filter: string): boolean =>
    entry.label.toLowerCase().includes(filter.trim().toLowerCase());

  const available = $derived(all.filter((entry) => !value.includes(entry.value)));
  const chosen = $derived(
    value.flatMap((entry) => {
      const found = byValue.get(entry);
      return found === undefined ? [] : [found];
    }),
  );
  const availableShown = $derived(available.filter((entry) => matches(entry, availableFilter)));
  const chosenShown = $derived(chosen.filter((entry) => matches(entry, selectedFilter)));

  const movable = (
    shown: readonly FieldOption[],
    picked: readonly string[] | undefined,
  ): string[] =>
    shown
      .filter(
        (entry) =>
          entry.disabled !== true && (picked === undefined || picked.includes(entry.value)),
      )
      .map((entry) => entry.value);

  const toAdd = $derived(movable(availableShown, availablePicked));
  const toAddAll = $derived(movable(availableShown, undefined));
  const toRemove = $derived(movable(chosenShown, selectedPicked));
  const toRemoveAll = $derived(movable(chosenShown, undefined));
  // Reordering a filtered list would swap with hidden neighbours.
  const reorderable = $derived(orderable && !disabled && selectedFilter.trim() === '');
  const pickedSet = $derived(new Set(toRemove));
  const canUp = $derived(reorderable && canShift(value, pickedSet, 'up'));
  const canDown = $derived(reorderable && canShift(value, pickedSet, 'down'));

  const commit = (next: string[]): void => {
    value = next;
    onValueChange?.(next);
  };

  const add = (values: readonly string[]): void => {
    if (disabled || values.length === 0) return;
    commit([...value, ...values]);
    availablePicked = [];
    announcement = movedLabel(values.length, selectedLabel);
  };

  const remove = (values: readonly string[]): void => {
    if (disabled || values.length === 0) return;
    const gone = new Set(values);
    commit(value.filter((entry) => !gone.has(entry)));
    selectedPicked = [];
    announcement = movedLabel(values.length, availableLabel);
  };

  const shift = (direction: 'up' | 'down'): void => {
    if (!(direction === 'up' ? canUp : canDown)) return;
    commit(shiftPicked(value, pickedSet, direction));
    announcement = reorderedLabel(pickedSet.size, direction);
  };

  /** Move the highlighted options out of the list with this id, if it is one of ours. */
  const moveFrom = (listId: string | undefined): boolean => {
    if (listId === availableId) add(toAdd);
    else if (listId === selectedId) remove(toRemove);
    else return false;
    return true;
  };

  const reorderKeys: Record<string, 'up' | 'down'> = { ArrowUp: 'up', ArrowDown: 'down' };

  const onkeydown = (event: KeyboardEvent): void => {
    const target = event.target instanceof HTMLElement ? event.target.id : undefined;
    const direction = reorderKeys[event.key];
    if (event.key === 'Enter' && moveFrom(target)) event.preventDefault();
    else if (event.altKey && direction !== undefined && target === selectedId) shift(direction);
  };

  const ondblclick = (event: MouseEvent): void => {
    const hit = event.target instanceof Element ? event.target.closest('[role="option"]') : null;
    moveFrom(hit?.closest('[role="listbox"]')?.id);
  };

  /** What both panes share. */
  const pane = $derived({ searchable, option, rows, size, disabled, invalid, emptyLabel });
  const transfers = $derived([
    { label: addLabel, Icon: ChevronRight, moves: toAdd, run: () => { add(toAdd); } },
    { label: addAllLabel, Icon: ChevronsRight, moves: toAddAll, run: () => { add(toAddAll); } },
    { label: removeLabel, Icon: ChevronLeft, moves: toRemove, run: () => { remove(toRemove); } },
    {
      label: removeAllLabel,
      Icon: ChevronsLeft,
      moves: toRemoveAll,
      run: () => {
        remove(toRemoveAll);
      },
    },
  ]);
  const reorders = $derived([
    { label: moveUpLabel, Icon: ArrowUp, enabled: canUp, run: () => { shift('up'); } },
    { label: moveDownLabel, Icon: ArrowDown, enabled: canDown, run: () => { shift('down'); } },
  ]);
</script>

<!-- Enter and double-click arrive here from the listboxes, which own the
     focus; the buttons are the pointer and keyboard alternative. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  {...rest}
  {id}
  role="group"
  aria-labelledby={labelId}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  class={['grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]', className]}
  {onkeydown}
  {ondblclick}
>
  <TransferPane
    id={availableId}
    heading={availableLabel}
    options={availableShown}
    bind:picked={availablePicked}
    bind:filter={availableFilter}
    filterLabel={filterLabel(availableLabel)}
    required={false}
    {...pane}
  />
  <div
    role="group"
    aria-label={transferLabel}
    class="flex justify-center gap-1 self-center sm:flex-col"
  >
    {#each transfers as transfer (transfer.label)}
      <IconButtonCore
        label={transfer.label}
        variant="outline"
        size="sm"
        disabled={disabled || transfer.moves.length === 0}
        onclick={transfer.run}
      >
        {#snippet icon()}
          <!-- Stacked panes put the lists above and below, so the arrows turn. -->
          <transfer.Icon class="size-4 rotate-90 sm:rotate-0 sm:rtl:rotate-180" />
        {/snippet}
      </IconButtonCore>
    {/each}
  </div>
  <TransferPane
    id={selectedId}
    heading={selectedLabel}
    options={chosenShown}
    bind:picked={selectedPicked}
    bind:filter={selectedFilter}
    filterLabel={filterLabel(selectedLabel)}
    {required}
    {...pane}
  >
    {#snippet footer()}
      {#if orderable}
        <div class="flex justify-end gap-1">
          {#each reorders as reorder (reorder.label)}
            <IconButtonCore
              label={reorder.label}
              variant="outline"
              size="sm"
              disabled={!reorder.enabled}
              onclick={reorder.run}
            >
              {#snippet icon()}<reorder.Icon class="size-4" />{/snippet}
            </IconButtonCore>
          {/each}
        </div>
      {/if}
    {/snippet}
  </TransferPane>
  <p role="status" class="sr-only">{announcement}</p>
</div>
{#if name !== undefined}
  {#each value as chosenValue (chosenValue)}
    <input type="hidden" {name} value={chosenValue} />
  {/each}
{/if}
