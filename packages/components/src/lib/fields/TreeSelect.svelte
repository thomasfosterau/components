<!-- @component
A select-like field whose popover is a searchable tree: pick one node, or check many with tri-state parents.
-->
<!--
  The trigger is a select-only `combobox` with `aria-haspopup="tree"`; the
  popover holds an optional filter box and a `TreeView` (a checkbox tree when
  `multiple`). Multiple selection is held as checked leaves (`tree-select.ts`)
  and reported per `strategy`.
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { Popover } from 'bits-ui';
  import { untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { SvelteSet } from 'svelte/reactivity';
  import TreeView from '../data/TreeView.svelte';
  import type { TreeNode } from '../data/tree-view.ts';
  import { selectSize, type FieldSize } from './field-types.ts';
  import {
    checkState,
    filterTree,
    findTreeNode,
    leavesOfValue,
    toggleCheck,
    valueOfLeaves,
    type TreeSelectStrategy,
  } from './tree-select.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
    /** The tree; a node's `id` is its value. */
    nodes: readonly TreeNode[];
    /**
     * Check many nodes rather than pick one.
     * @defaultValue `false`
     */
    multiple?: boolean | undefined;
    /** The chosen node's id (single). Bindable. */
    value?: string | undefined;
    /**
     * The checked ids, reported per `strategy` (multiple). Bindable.
     * @defaultValue `[]`
     */
    values?: string[] | undefined;
    /**
     * What a fully checked subtree reports: `'parent'` the node, `'leaf'` its leaves, `'all'` both.
     * @defaultValue `'parent'`
     */
    strategy?: TreeSelectStrategy | undefined;
    /**
     * Only leaves can be picked (single); parents only expand.
     * @defaultValue `false`
     */
    leavesOnly?: boolean | undefined;
    /**
     * A filter box above the tree; matches and their ancestors stay visible.
     * @defaultValue `true`
     */
    searchable?: boolean | undefined;
    /**
     * Ids of the expanded nodes. Bindable; mutated in place.
     * @defaultValue `new SvelteSet()`
     */
    expanded?: SvelteSet<string> | undefined;
    /**
     * Trigger text while nothing is chosen.
     * @defaultValue `'Select…'`
     */
    placeholder?: string | undefined;
    /**
     * Show at most this many labels in the trigger, then the overflow count (multiple).
     * @defaultValue `2`
     */
    maxShown?: number | undefined;
    /**
     * Formats the overflow count.
     * @defaultValue `(n) => \`+${n}\``
     */
    formatOverflow?: ((hidden: number) => string) | undefined;
    /** Posts each chosen value under this name, one hidden input per value. */
    name?: string | undefined;
    /**
     * Disables the trigger.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /**
     * daisyUI size step of the trigger.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * The tree's name when no `FormField` label names it.
     * @defaultValue `'Options'`
     */
    treeLabel?: string | undefined;
    /**
     * The filter box's name.
     * @defaultValue `'Filter'`
     */
    searchLabel?: string | undefined;
    /**
     * Announced when the filter matches nothing.
     * @defaultValue `'No matches'`
     */
    noResultsLabel?: string | undefined;
    /**
     * Announced with the filter's match count.
     * @defaultValue `(n) => \`${n} matches\`` (singular for one)
     */
    matchesLabel?: ((count: number) => string) | undefined;
    /**
     * The clear button's name.
     * @defaultValue `'Clear selection'`
     */
    clearLabel?: string | undefined;
    /** `FieldControl`: the trigger's `id`, which `FormField`'s label points at. Minted when omitted. */
    id?: string | undefined;
    /** `FieldControl`: the visible label's id; also names the tree. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: sets `aria-required` on the trigger.
     * @defaultValue `false`
     */
    required?: boolean | undefined;
  }

  let {
    nodes,
    multiple = false,
    value = $bindable(),
    values = $bindable([]),
    strategy = 'parent',
    leavesOnly = false,
    searchable = true,
    expanded = $bindable(new SvelteSet<string>()),
    placeholder = 'Select…',
    maxShown = 2,
    formatOverflow = (hidden) => `+${hidden}`,
    name,
    disabled = false,
    size = 'md',
    treeLabel = 'Options',
    searchLabel = 'Filter',
    noResultsLabel = 'No matches',
    matchesLabel = (count) => `${count} ${count === 1 ? 'match' : 'matches'}`,
    clearLabel = 'Clear selection',
    id,
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const triggerId = $derived(id ?? uid);
  const treeId = `${uid}-tree`;

  let open = $state(false);
  let query = $state('');

  const filtered = $derived(filterTree(nodes, query));
  // Single choice with `leavesOnly`: parents are disabled, so they expand but are never picked.
  const shown = $derived(!multiple && leavesOnly ? disableParents(filtered.nodes) : filtered.nodes);
  const status = $derived(
    query.trim() === '' ? '' : filtered.matches === 0 ? noResultsLabel : matchesLabel(filtered.matches),
  );

  function disableParents(list: readonly TreeNode[]): TreeNode[] {
    return list.map((node) =>
      node.children === undefined || node.children.length === 0
        ? node
        : { ...node, disabled: true, children: disableParents(node.children) },
    );
  }

  // A filter expands the ancestors of what it matched.
  $effect(() => {
    for (const ancestor of filtered.ancestors) expanded.add(ancestor);
  });

  const checkedLeaves = $derived(leavesOfValue(nodes, values));
  const chosenIds = $derived(multiple ? values : value === undefined ? [] : [value]);
  const chosenLabels = $derived(
    chosenIds.flatMap((chosen) => findTreeNode(nodes, chosen)?.label ?? []),
  );
  const summary = $derived(
    chosenLabels.length <= maxShown
      ? chosenLabels.join(', ')
      : [...chosenLabels.slice(0, maxShown), formatOverflow(chosenLabels.length - maxShown)].join(', '),
  );

  /** A checkbox tree's state, from the full node: a filtered one may have lost children. */
  const checked = (node: TreeNode): boolean | 'mixed' =>
    checkState(findTreeNode(nodes, node.id) ?? node, checkedLeaves);

  function onCheck(node: TreeNode): void {
    const full = findTreeNode(nodes, node.id) ?? node;
    values = valueOfLeaves(nodes, toggleCheck(full, checkedLeaves), strategy);
  }

  // Single choice goes through the tree's own selection set.
  const selected = new SvelteSet<string>();
  // A caller's `value` flows into the set; only `value` is tracked, so the
  // tree's own selection is not undone before it reaches `value`.
  $effect.pre(() => {
    const current = value;
    untrack(() => {
      if (current === undefined ? selected.size === 0 : selected.size === 1 && selected.has(current)) return;
      selected.clear();
      if (current !== undefined) selected.add(current);
    });
  });
  $effect(() => {
    if (multiple) return;
    const [first] = selected;
    if (first !== value) value = first;
  });

  function onActivate(): void {
    if (!multiple) open = false;
  }

  function clearQueryOnClose(next: boolean): void {
    if (!next) query = '';
  }

  function clear(): void {
    if (multiple) values = [];
    else value = undefined;
  }

  function onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    document.getElementById(treeId)?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]')?.focus();
  }
</script>

<div {...rest} class={['flex w-full items-center gap-1', className]}>
  <Popover.Root bind:open onOpenChange={clearQueryOnClose}>
    <Popover.Trigger {disabled}>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          id={triggerId}
          role="combobox"
          aria-haspopup="tree"
          aria-controls={treeId}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          aria-invalid={invalid ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          class={['select flex-1 text-start', selectSize[size], invalid && 'select-error']}
        >
          <span class={['truncate', chosenLabels.length === 0 && 'text-base-content/60']}>
            {chosenLabels.length === 0 ? placeholder : summary}
          </span>
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        sideOffset={4}
        class="bg-base-100 rounded-box border-base-300 z-50 flex max-h-96 w-(--bits-popover-anchor-width) min-w-64 flex-col gap-2 border p-2 shadow-lg"
      >
        {#if searchable}
          <input
            type="search"
            class="input input-sm w-full"
            aria-label={searchLabel}
            aria-controls={treeId}
            bind:value={query}
            onkeydown={onSearchKeydown}
          />
        {/if}
        <div class="min-h-0 overflow-auto">
          <TreeView
            id={treeId}
            nodes={shown}
            label={treeLabel}
            aria-labelledby={labelId}
            bind:expanded
            {selected}
            selection={multiple ? 'none' : 'single'}
            checked={multiple ? checked : undefined}
            onCheck={multiple ? onCheck : undefined}
            {onActivate}
          />
        </div>
        <p role="status" class="text-base-content/70 px-2 text-sm empty:hidden">{status}</p>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
  {#if chosenIds.length > 0 && !disabled}
    <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label={clearLabel} onclick={clear}>
      <X class="size-4" aria-hidden="true" />
    </button>
  {/if}
  {#if name !== undefined}
    {#each chosenIds as chosen (chosen)}
      <input type="hidden" {name} value={chosen} {disabled} />
    {/each}
  {/if}
</div>
