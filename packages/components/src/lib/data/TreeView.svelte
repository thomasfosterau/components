<!-- @component
An ARIA `tree` widget over a `nodes` array: one tab stop, arrow-key navigation, typeahead, single or multiple selection, and children that can load on first expand.
-->
<!--
  TreeView — a hierarchy the reader navigates and selects from, not just
  reads: a taxonomy picker, a folder of plan files, a garden → bed → plant
  browser.

  TreeView or TreeList? Can the reader select a node, or does the tree run
  past a few dozen nodes? TreeView. A hierarchy to read, with links or
  arbitrary content in its rows? `TreeList`, the native `<details>`
  disclosure — it costs a Tab stop per node, and that is fine for reading and
  unusable for choosing.

  Hand-rolled, deliberately: bits-ui (2.20) has no tree primitive, and Melt
  UI's would be a third-party runtime dependency, which AGENTS.md routes to a
  package of its own, for a pattern whose whole contract is one
  well-specified APG page (Tree View). The keyboard arithmetic is pure
  functions over the flattened visible order in `tree-view.ts`; this file
  only wires events to them and holds the state.

  Data-driven rather than nested child components: roving focus and
  typeahead need the visible order, which a data model gives directly and a
  component tree would have to rebuild through context.

  ARIA contract (APG Tree View):
  - `<ul role="tree" aria-label={label}>`, `aria-multiselectable="true"` when
    `selection="multiple"`.
  - Each node is an `<li role="treeitem">`, named by its row through
    `aria-labelledby` (not by its content, which holds its subtree), with
    `aria-level`, `aria-setsize` and `aria-posinset`; `aria-expanded` on parents only, never on a leaf;
    `aria-selected` unless `selection="none"`; `aria-disabled` on a disabled
    node; `aria-busy` (and `loadingLabel` as its description) while its
    children load. A parent's children are an `<ul role="group">` inside it,
    rendered only while it is expanded.
  - Roving tabindex: exactly one treeitem has `tabindex="0"` — the focused
    node, else the first selected visible node, else the first.
  - Keys: ↓/↑ next/previous visible node; → expands a closed parent, moves
    to the first child of an open one; ← collapses an open parent, else
    moves to the parent; Home/End first/last visible node; Enter calls
    `onActivate` (and selects, in single selection); Space selects (single)
    or toggles (multiple); `*` expands every sibling parent; printable
    characters typeahead (500 ms buffer; one key repeated cycles). In
    multiple selection Shift+↓/↑ moves and adds the node reached to the
    selection, Shift+Space selects from the node last toggled (by Space or a
    click) to the focused one, Ctrl/⌘+Shift+Home/End selects from the focused
    node to the first / last and moves there, and Ctrl/⌘+A selects every
    visible enabled node — `Listbox`'s recommended model. A range never
    selects a disabled node.
  - A disabled node stays focusable and expandable (its children may not be
    disabled) but is never selected or activated.
  - Pointer: clicking a row focuses and selects it (toggles, in multiple
    selection), then expands or collapses a parent or activates a leaf;
    clicking the chevron only expands or collapses.

  `expanded` and `selected` are mutated in place, never replaced, so a
  caller's `bind:` and a caller holding the same `SvelteSet` both see every
  change. `loadChildren` runs once per node, on its first expand (or when a
  caller expands it through `expanded`), and its signal aborts if the node
  collapses, or the tree unmounts, before it resolves; a rejection collapses
  the node again, so expanding it retries.
-->
<script module lang="ts">
  /** Which multiple-selection chord a keydown is, if any. */
  function selectionChordOf(event: KeyboardEvent): 'all' | 'first' | 'last' | 'range' | undefined {
    if (event.altKey) return undefined;
    const command = event.ctrlKey || event.metaKey;
    if (command && event.key.toLowerCase() === 'a') return 'all';
    if (command && event.shiftKey && event.key === 'Home') return 'first';
    if (command && event.shiftKey && event.key === 'End') return 'last';
    if (!command && event.shiftKey && event.key === ' ') return 'range';
    return undefined;
  }
</script>

<script lang="ts" generics="T">
  import { ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type {
    FocusEventHandler,
    HTMLAttributes,
    KeyboardEventHandler,
    MouseEventHandler,
  } from 'svelte/elements';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import {
    firstChildTreeIndex,
    nextTreeIndex,
    parentTreeIndex,
    previousTreeIndex,
    siblingParentIds,
    treeIndexOf,
    typeaheadTreeIndex,
    visibleTreeNodes,
    type TreeNode,
    type VisibleTreeNode,
    type TreeRowState,
    type TreeSelection,
    type TreeShape,
  } from './tree-view.ts';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    /** The root nodes. */
    nodes: readonly TreeNode<T>[];
    /** The tree's accessible name. */
    label: string;
    /**
     * Ids of the expanded nodes. Bindable; mutated in place.
     * @defaultValue `new SvelteSet()`
     */
    expanded?: SvelteSet<string> | undefined;
    /**
     * Ids of the selected nodes. Bindable; mutated in place.
     * @defaultValue `new SvelteSet()`
     */
    selected?: SvelteSet<string> | undefined;
    /**
     * Whether nodes can be selected, and how many at once.
     * @defaultValue `'single'`
     */
    selection?: TreeSelection | undefined;
    /** Draws a node's row; defaults to its `label`. Keep it free of focusable content. */
    row?: Snippet<[node: TreeNode<T>, state: TreeRowState]> | undefined;
    /** Fetches a node's children on its first expand; a node with `children: []` is one still to load. */
    loadChildren?:
      | ((node: TreeNode<T>, signal: AbortSignal) => Promise<readonly TreeNode<T>[]>)
      | undefined;
    /** A node was activated: Enter, or a click on a leaf. */
    onActivate?: ((node: TreeNode<T>) => void) | undefined;
    /**
     * Spoken as a loading node's description while its children load.
     * @defaultValue `'Loading'`
     */
    loadingLabel?: string | undefined;
    /**
     * The tree element's id.
     * @defaultValue minted with `$props.id()`
     */
    id?: string | undefined;
  }

  const uid = $props.id();

  let {
    nodes,
    label,
    expanded = $bindable(new SvelteSet<string>()),
    selected = $bindable(new SvelteSet<string>()),
    selection = 'single',
    row,
    loadChildren,
    onActivate,
    loadingLabel = 'Loading',
    id = uid,
    onkeydown: callerKeydown,
    onfocusin: callerFocusin,
    onclick: callerClick,
    class: className,
    ...rest
  }: Props = $props();

  const TYPEAHEAD_MS = 500;
  const busyId = $derived(`${id}-busy`);

  /** Children fetched by `loadChildren`, by parent id. */
  const loaded = new SvelteMap<string, readonly TreeNode<T>[]>();
  /** Ids whose children are loading — what `aria-busy` reads. */
  const busy = new SvelteSet<string>();
  /** In-flight loads; plain, so the loading effect never tracks its own writes. */
  const controllers = new Map<string, AbortController>();

  const shape: TreeShape<T> = {
    childrenOf: (node) => loaded.get(node.id) ?? node.children,
    isParent: (node) => {
      const children = loaded.get(node.id) ?? node.children;
      if (children === undefined) return false;
      return children.length > 0 || (loadChildren !== undefined && !loaded.has(node.id));
    },
  };

  const visible = $derived(visibleTreeNodes(nodes, expanded, shape));

  /** The id of the node keyboard focus is on, or was last on. */
  let focusedId = $state<string | undefined>(undefined);

  /** The one node with `tabindex="0"`. */
  const tabStopId = $derived.by(() => {
    if (treeIndexOf(visible, focusedId) !== -1) return focusedId;
    return (visible.find((entry) => selected.has(entry.node.id)) ?? visible[0])?.node.id;
  });

  // A treeitem's name would otherwise be computed from its whole content,
  // its expanded group of descendants included; `aria-labelledby` pins it to
  // the row. Node ids are arbitrary strings, so the DOM ids are minted.
  const rowIds = new Map<string, string>();
  function rowId(node: TreeNode<T>): string {
    let minted = rowIds.get(node.id);
    if (minted === undefined) {
      minted = `${id}-row-${rowIds.size}`;
      rowIds.set(node.id, minted);
    }
    return minted;
  }

  const elements = new Map<string, HTMLElement>();
  const nodeOf = new WeakMap<Element, TreeNode<T>>();

  function register(node: TreeNode<T>): Attachment<HTMLElement> {
    return (element) => {
      elements.set(node.id, element);
      nodeOf.set(element, node);
      return () => {
        if (elements.get(node.id) === element) elements.delete(node.id);
      };
    };
  }

  // Start a load for every visible, expanded parent whose children are still
  // to come; abort any load whose node is no longer expanded.
  $effect(() => {
    const load = loadChildren;
    if (load === undefined) return;
    for (const entry of visible) {
      const { node } = entry;
      if (!entry.expanded || loaded.has(node.id) || controllers.has(node.id)) continue;
      const controller = new AbortController();
      controllers.set(node.id, controller);
      busy.add(node.id);
      void fetchChildren(load, node, controller);
    }
    for (const [nodeId, controller] of controllers) {
      if (!expanded.has(nodeId)) {
        controller.abort();
        settle(nodeId, controller);
      }
    }
  });

  async function fetchChildren(
    load: (node: TreeNode<T>, signal: AbortSignal) => Promise<readonly TreeNode<T>[]>,
    node: TreeNode<T>,
    controller: AbortController,
  ): Promise<void> {
    try {
      const children = await load(node, controller.signal);
      if (controller.signal.aborted) return;
      loaded.set(node.id, children);
      settle(node.id, controller);
    } catch {
      if (controller.signal.aborted) return;
      // A failed load collapses the node, so expanding it again retries.
      settle(node.id, controller);
      expanded.delete(node.id);
    }
  }

  function settle(nodeId: string, controller: AbortController): void {
    if (controllers.get(nodeId) !== controller) return;
    controllers.delete(nodeId);
    busy.delete(nodeId);
  }

  let typed = '';
  let typedTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => () => {
    for (const controller of controllers.values()) controller.abort();
    controllers.clear();
    clearTimeout(typedTimer);
  });

  function focusNode(node: TreeNode<T> | undefined): void {
    if (node === undefined) return;
    focusedId = node.id;
    elements.get(node.id)?.focus();
  }

  /** The node Space or a click last toggled: where Shift+Space ranges from. */
  let anchorId: string | undefined;

  function toggleExpanded(node: TreeNode<T>): void {
    if (expanded.has(node.id)) expanded.delete(node.id);
    else expanded.add(node.id);
  }

  function select(node: TreeNode<T>): void {
    if (node.disabled === true || selection === 'none') return;
    if (selection === 'single') {
      if (selected.size === 1 && selected.has(node.id)) return;
      selected.clear();
    }
    selected.add(node.id);
  }

  function toggleSelected(node: TreeNode<T>): void {
    anchorId = node.id;
    if (selection === 'multiple' && node.disabled !== true && selected.has(node.id)) {
      selected.delete(node.id);
    } else {
      select(node);
    }
  }

  /** Select every enabled visible node between two visible indices, inclusive. */
  function selectBetween(from: number, to: number): void {
    const [low, high] = from <= to ? [from, to] : [to, from];
    for (let index = low; index <= high; index += 1) {
      const between = visible[index];
      if (between !== undefined) select(between.node);
    }
  }

  function activate(node: TreeNode<T>): void {
    if (node.disabled === true) return;
    if (selection === 'single') select(node);
    onActivate?.(node);
  }

  function typeahead(index: number, key: string): void {
    clearTimeout(typedTimer);
    typed += key;
    typedTimer = setTimeout(() => {
      typed = '';
    }, TYPEAHEAD_MS);
    const match = typeaheadTreeIndex(visible, index, typed);
    if (match !== -1) focusNode(visible[match]?.node);
  }

  /** Multiple selection's chords: Ctrl/⌘+A, Ctrl/⌘+Shift+Home/End, Shift+Space. Whether one matched. */
  function selectionChord(event: KeyboardEvent, index: number): boolean {
    const chord = selection === 'multiple' ? selectionChordOf(event) : undefined;
    if (chord === undefined) return false;
    if (chord === 'all') {
      for (const other of visible) select(other.node);
    } else if (chord === 'range') {
      const from = anchorId === undefined ? -1 : treeIndexOf(visible, anchorId);
      selectBetween(from === -1 ? index : from, index);
    } else {
      const edge = chord === 'first' ? 0 : visible.length - 1;
      selectBetween(index, edge);
      focusNode(visible[edge]?.node);
    }
    return true;
  }

  /** The arrow, Home and End keys. Whether one matched. */
  function navigationKey(event: KeyboardEvent, index: number, entry: VisibleTreeNode<T>): boolean {
    const { node } = entry;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const target =
          visible[event.key === 'ArrowDown' ? nextTreeIndex(visible, index) : previousTreeIndex(index)];
        focusNode(target?.node);
        if (event.shiftKey && selection === 'multiple' && target !== undefined) select(target.node);
        return true;
      }
      case 'ArrowRight':
        if (entry.parent && !entry.expanded) expanded.add(node.id);
        else if (entry.expanded) focusNode(visible[firstChildTreeIndex(visible, index)]?.node);
        return true;
      case 'ArrowLeft':
        if (entry.expanded) expanded.delete(node.id);
        else focusNode(visible[parentTreeIndex(visible, index)]?.node);
        return true;
      case 'Home':
        focusNode(visible[0]?.node);
        return true;
      case 'End':
        focusNode(visible.at(-1)?.node);
        return true;
      default:
        return false;
    }
  }

  /** Enter, Space, `*` and typeahead. Whether one matched. */
  function actionKey(event: KeyboardEvent, index: number, node: TreeNode<T>): boolean {
    if (event.key === 'Enter') activate(node);
    else if (event.key === ' ') toggleSelected(node);
    else if (event.key === '*') {
      for (const siblingId of siblingParentIds(visible, index)) expanded.add(siblingId);
    } else if (event.key.length === 1 && event.key.trim() !== '') typeahead(index, event.key);
    else return false;
    return true;
  }

  const onkeydown: KeyboardEventHandler<HTMLUListElement> = (event) => {
    callerKeydown?.(event);
    if (event.defaultPrevented) return;
    const index = treeIndexOf(visible, focusedId);
    const entry = visible[index];
    if (entry === undefined) return;
    const plain = !(event.ctrlKey || event.metaKey || event.altKey);
    const handled =
      selectionChord(event, index) ||
      (plain && (navigationKey(event, index, entry) || actionKey(event, index, entry.node)));
    if (handled) event.preventDefault();
  };

  /** The treeitem an event happened inside, and its node. */
  function itemOf(event: Event): { element: HTMLElement; node: TreeNode<T> } | undefined {
    if (!(event.target instanceof Element)) return undefined;
    const element = event.target.closest('[role="treeitem"]');
    if (!(element instanceof HTMLElement)) return undefined;
    const node = nodeOf.get(element);
    return node === undefined ? undefined : { element, node };
  }

  const onfocusin: FocusEventHandler<HTMLUListElement> = (event) => {
    callerFocusin?.(event);
    const item = itemOf(event);
    if (item !== undefined && item.element === event.target) focusedId = item.node.id;
  };

  const onclick: MouseEventHandler<HTMLUListElement> = (event) => {
    callerClick?.(event);
    if (event.defaultPrevented) return;
    const item = itemOf(event);
    if (item === undefined) return;
    const { node } = item;
    focusNode(node);
    const onChevron =
      event.target instanceof Element && event.target.closest('[data-tree-toggle]') !== null;
    if (onChevron && shape.isParent(node)) {
      toggleExpanded(node);
      return;
    }
    if (selection === 'multiple') toggleSelected(node);
    else select(node);
    if (shape.isParent(node)) toggleExpanded(node);
    else activate(node);
  };

  const rowClasses = {
    selected: 'bg-primary text-primary-content',
    idle: 'hover:bg-base-200',
  } as const;
</script>

{#snippet branch(list: readonly TreeNode<T>[], level: number)}
  {#each list as node, index (node.id)}
    {@const parent = shape.isParent(node)}
    {@const open = parent && expanded.has(node.id)}
    {@const isSelected = selected.has(node.id)}
    {@const isBusy = busy.has(node.id)}
    {@const children = shape.childrenOf(node)}
    <li
      role="treeitem"
      tabindex={node.id === tabStopId ? 0 : -1}
      aria-level={level}
      aria-setsize={list.length}
      aria-posinset={index + 1}
      aria-expanded={parent ? open : undefined}
      aria-selected={selection === 'none' ? undefined : isSelected}
      aria-disabled={node.disabled === true ? true : undefined}
      aria-busy={isBusy ? true : undefined}
      aria-labelledby={rowId(node)}
      aria-describedby={isBusy ? busyId : undefined}
      class="outline-none"
      {@attach register(node)}
    >
      <div
        id={rowId(node)}
        class={[
          'rounded-field flex cursor-pointer items-center gap-1 px-2 py-1 select-none',
          '[:focus-visible>&]:outline-primary [:focus-visible>&]:-outline-offset-2 [:focus-visible>&]:outline-2',
          isSelected ? rowClasses.selected : rowClasses.idle,
          node.disabled === true && 'cursor-not-allowed opacity-60',
        ]}
      >
        {#if parent}
          <span data-tree-toggle class="inline-flex shrink-0" aria-hidden="true">
            <ChevronRight
              class={['size-4 transition-transform', open && 'rotate-90']}
              aria-hidden="true"
            />
          </span>
        {:else}
          <span class="inline-block size-4 shrink-0" aria-hidden="true"></span>
        {/if}
        {#if row}
          {@render row(node, { expanded: open, selected: isSelected, level })}
        {:else}
          <span>{node.label}</span>
        {/if}
        {#if isBusy}
          <span class="loading loading-spinner loading-xs ms-auto" aria-hidden="true"></span>
        {/if}
      </div>
      {#if open && children !== undefined && children.length > 0}
        <ul role="group" class="border-base-300 ms-3 border-s-2 ps-1">
          {@render branch(children, level + 1)}
        </ul>
      {/if}
    </li>
  {/each}
{/snippet}

<ul
  {...rest}
  {id}
  role="tree"
  aria-label={label}
  aria-multiselectable={selection === 'multiple' ? true : undefined}
  class={['flex flex-col', className]}
  {onkeydown}
  {onfocusin}
  {onclick}
>
  {@render branch(nodes, 1)}
</ul>
<span id={busyId} hidden>{loadingLabel}</span>
