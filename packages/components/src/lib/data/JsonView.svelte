<!-- @component
A read-only, collapsible tree of structured data: keys beside typed values, a filter, expand and collapse all, and copying a node's value or path.
-->
<!--
  JsonView — devtools' object inspector for any JSON-compatible value, on
  `TreeView`, so it is an APG `tree` with roving focus and typeahead by key.

  ARIA and keyboard contract (beyond `TreeView`'s):
  - Each treeitem's name reads naturally ("count: 12, number", "beds,
    array, 4 items"); the type word is the cue, never colour alone.
  - Ctrl/⌘+C copies the focused node's value as JSON (unless text is
    selected), announced politely. Copy value and Copy path in the toolbar
    act on the selected node, else the root.
  - The filter is a `searchbox` that controls the tree; it keeps matching
    nodes and their ancestors, expands those ancestors, marks the matched
    text and announces the count.
  - A string longer than `maxStringLength` is cut; Enter (or a click) on
    it shows all of it.
  - Numbers are shown raw, not locale-formatted: inspecting data needs the
    exact value.
  - A collapsed node's children are not rendered until it is expanded.
-->
<script lang="ts">
  import { ChevronsDownUp, ChevronsUpDown, Search } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, KeyboardEventHandler } from 'svelte/elements';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from '../ui/Button.svelte';
  import CopyButton from '../ui/CopyButton.svelte';
  import JsonRow from './JsonRow.svelte';
  import {
    containerIds,
    filterJson,
    formatJsonPath,
    idsToDepth,
    isCopyKey,
    jsonTree,
    pathOfItem,
    toJson,
    type JsonEntry,
    type JsonKind,
    type JsonPathSegment,
  } from './json-path.ts';
  import TreeView from './TreeView.svelte';
  import type { TreeNode } from './tree-view.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The data: anything `JSON.stringify` accepts. Cycles show as a marker. */
    value: unknown;
    /**
     * The tree's accessible name.
     * @defaultValue `'Data'`
     */
    label?: string | undefined;
    /**
     * Levels expanded at first.
     * @defaultValue `1`
     */
    expandDepth?: number | undefined;
    /**
     * The root node's key.
     * @defaultValue `'root'`
     */
    rootLabel?: string | undefined;
    /**
     * Show the root's children as the top level.
     * @defaultValue `false`
     */
    hideRoot?: boolean | undefined;
    /**
     * Show the filter box.
     * @defaultValue `true`
     */
    searchable?: boolean | undefined;
    /**
     * Copy value and Copy path, and Ctrl/⌘+C.
     * @defaultValue `true`
     */
    copyable?: boolean | undefined;
    /**
     * Strings longer than this are cut until shown.
     * @defaultValue `200`
     */
    maxStringLength?: number | undefined;
    /**
     * Sort object keys.
     * @defaultValue `false`
     */
    sortKeys?: boolean | undefined;
    /** Draws a primitive value (a date for an ISO string). Keep it free of focusable content. */
    renderValue?: Snippet<[{ value: unknown; path: readonly JsonPathSegment[] }]> | undefined;
    /**
     * The type words in each node's name.
     * @defaultValue `{ string: 'string', number: 'number', boolean: 'boolean', null: 'null', object: 'object', array: 'array', circular: 'circular reference' }`
     */
    typeLabels?: Readonly<Record<JsonKind, string>> | undefined;
    /** @defaultValue `` (n) => (n === 1 ? '1 item' : `${n} items`) `` */
    itemsLabel?: ((count: number) => string) | undefined;
    /** @defaultValue `` (n) => (n === 1 ? '1 key' : `${n} keys`) `` */
    keysLabel?: ((count: number) => string) | undefined;
    /** @defaultValue `'[Circular]'` */
    circularLabel?: string | undefined;
    /** @defaultValue `'Filter'` */
    filterLabel?: string | undefined;
    /**
     * The filter's match count.
     * @defaultValue `` (n) => (n === 0 ? 'No matches' : n === 1 ? '1 match' : `${n} matches`) ``
     */
    matchesLabel?: ((count: number) => string) | undefined;
    /** @defaultValue `'Expand all'` */
    expandAllLabel?: string | undefined;
    /** @defaultValue `'Collapse all'` */
    collapseAllLabel?: string | undefined;
    /** @defaultValue `'Copy value'` */
    copyValueLabel?: string | undefined;
    /** @defaultValue `'Copy path'` */
    copyPathLabel?: string | undefined;
    /** @defaultValue `'Copied'` */
    copiedLabel?: string | undefined;
    /** @defaultValue `'Could not copy'` */
    copyFailedLabel?: string | undefined;
    /** @defaultValue `'Show more'` */
    showMoreLabel?: string | undefined;
  }

  let {
    value,
    label = 'Data',
    expandDepth = 1,
    rootLabel = 'root',
    hideRoot = false,
    searchable = true,
    copyable = true,
    maxStringLength = 200,
    sortKeys = false,
    renderValue,
    typeLabels = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      null: 'null',
      object: 'object',
      array: 'array',
      circular: 'circular reference',
    },
    itemsLabel = (count) => (count === 1 ? '1 item' : `${count} items`),
    keysLabel = (count) => (count === 1 ? '1 key' : `${count} keys`),
    circularLabel = '[Circular]',
    filterLabel = 'Filter',
    matchesLabel = (count) =>
      count === 0 ? 'No matches' : count === 1 ? '1 match' : `${count} matches`,
    expandAllLabel = 'Expand all',
    collapseAllLabel = 'Collapse all',
    copyValueLabel = 'Copy value',
    copyPathLabel = 'Copy path',
    copiedLabel = 'Copied',
    copyFailedLabel = 'Could not copy',
    showMoreLabel = 'Show more',
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const treeId = `${uid}-tree`;

  const root = $derived(jsonTree(value, { sortKeys, rootLabel }));
  const roots = $derived(hideRoot && root.children !== undefined ? root.children : [root]);
  const entries = $derived.by(() => {
    const byId = new Map<string, JsonEntry>();
    const walk = (node: TreeNode<JsonEntry>): void => {
      if (node.data !== undefined) byId.set(node.id, node.data);
      for (const child of node.children ?? []) walk(child);
    };
    walk(root);
    return byId;
  });

  let query = $state('');
  const filtered = $derived(filterJson(roots, query));
  const searching = $derived(query.trim() !== '');

  const expanded = new SvelteSet<string>();
  const selected = new SvelteSet<string>();
  /** Long strings shown whole. */
  const whole = new SvelteSet<string>();
  let status = $state('');

  const reset = (ids: readonly string[]): void => {
    expanded.clear();
    for (const id of ids) expanded.add(id);
  };

  $effect(() => {
    reset(searching ? filtered.expand : idsToDepth(roots, expandDepth));
  });

  $effect(() => {
    status = searching ? matchesLabel(filtered.matches) : '';
  });

  const target = (): JsonEntry | undefined => {
    const [id] = selected;
    return (id === undefined ? undefined : entries.get(id)) ?? root.data;
  };

  const sizeLabel = (entry: JsonEntry): string =>
    entry.kind === 'array' ? itemsLabel(entry.size) : keysLabel(entry.size);

  const long = (entry: JsonEntry): boolean =>
    entry.kind === 'string' && String(entry.value).length > maxStringLength;

  const onActivate = (node: TreeNode<JsonEntry>): void => {
    if (node.data === undefined || !long(node.data)) return;
    if (whole.has(node.id)) whole.delete(node.id);
    else whole.add(node.id);
  };

  const copyFocused: KeyboardEventHandler<HTMLUListElement> = (event) => {
    const entry = copyable && isCopyKey(event) ? entries.get(pathOfItem(event.target)) : undefined;
    if (entry === undefined) return;
    event.preventDefault();
    void copy(toJson(entry.value));
  };

  const copy = async (text: string): Promise<void> => {
    try {
      if (navigator.clipboard === undefined) throw new Error('No clipboard');
      await navigator.clipboard.writeText(text);
      status = copiedLabel;
    } catch {
      status = copyFailedLabel;
    }
  };
</script>

{#snippet row(node: TreeNode<JsonEntry>)}
  {#if node.data}
    {@const entry = node.data}
    {@const cut = long(entry) && !whole.has(node.id)}
    <JsonRow
      {entry}
      path={node.id}
      keyLabel={node.label}
      query={searching ? query : ''}
      typeLabel={typeLabels[entry.kind]}
      sizeLabel={entry.kind === 'array' || entry.kind === 'object' ? sizeLabel(entry) : ''}
      {circularLabel}
      text={cut ? `${String(entry.value).slice(0, maxStringLength)}…` : String(entry.value)}
      truncated={cut}
      moreLabel={showMoreLabel}
      {renderValue}
    />
  {/if}
{/snippet}

{#snippet expandIcon()}<ChevronsUpDown class="size-4" />{/snippet}
{#snippet collapseIcon()}<ChevronsDownUp class="size-4" />{/snippet}

<div {...rest} class={['flex flex-col gap-2', className]}>
  <div class="flex flex-wrap items-center gap-2">
    {#if searchable}
      <label class="input input-sm min-w-0 flex-1">
        <Search class="size-4 opacity-60" aria-hidden="true" />
        <input type="search" aria-label={filterLabel} aria-controls={treeId} bind:value={query} />
      </label>
    {/if}
    <Button size="sm" variant="ghost" icon={expandIcon} onclick={() => reset(containerIds(filtered.nodes))}>
      {expandAllLabel}
    </Button>
    <Button size="sm" variant="ghost" icon={collapseIcon} onclick={() => reset([])}>
      {collapseAllLabel}
    </Button>
    {#if copyable}
      <CopyButton
        label={copyValueLabel}
        {copiedLabel}
        failedLabel={copyFailedLabel}
        value={() => toJson(target()?.value)}
      />
      <CopyButton
        label={copyPathLabel}
        {copiedLabel}
        failedLabel={copyFailedLabel}
        value={() => formatJsonPath(target()?.path ?? [])}
      />
    {/if}
  </div>
  <TreeView
    id={treeId}
    nodes={filtered.nodes}
    {label}
    {expanded}
    {selected}
    {row}
    {onActivate}
    onkeydown={copyFocused}
  />
  <div role="status" class="sr-only">{status}</div>
</div>
