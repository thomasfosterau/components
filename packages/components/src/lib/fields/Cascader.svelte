<!-- @component
Pick a value from a hierarchy by drilling through columns (region → state → city), in a popover from a select-like trigger; children can load lazily and every level can be searched.
-->
<!--
  There is no APG pattern for cascading columns, so this composes two: the
  trigger is a button opening a non-modal dialog (bits-ui `Popover`), and
  each column is an APG listbox with `aria-activedescendant` focus, named
  after its parent. The columns are hand-rolled because bits-ui's listbox
  lives inside `Select` and `Combobox`. Below `sm` only the focused column
  shows, with a Back button: the drill-down list of a phone's settings.
-->
<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte';
  import { Popover } from 'bits-ui';
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import {
    isBranch,
    pathKey,
    resolvePath,
    searchTree,
    settle,
    type CascaderNode,
    type ChildrenOf,
  } from './cascader.ts';
  import CascaderColumn from './CascaderColumn.svelte';
  import CascaderSearch from './CascaderSearch.svelte';
  import { selectSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The top level of the hierarchy. */
    options: readonly CascaderNode[];
    /**
     * The chosen path of values, from the top level down. Bindable.
     * @defaultValue `[]`
     */
    value?: string[] | undefined;
    /** Called with the new path when one is chosen. */
    onValueChange?: ((value: readonly string[]) => void) | undefined;
    /**
     * Fetch the children of a node marked `hasChildren`, given its path. The
     * signal aborts when the reader moves to another branch first.
     */
    loadChildren?:
      | ((path: readonly string[], signal: AbortSignal) => Promise<readonly CascaderNode[]>)
      | undefined;
    /**
     * Let a branch be chosen, not only a leaf: opening a branch also chooses it.
     * @defaultValue `false`
     */
    selectParents?: boolean | undefined;
    /**
     * Show a search field over every level. Without `search`, it searches the
     * nodes in memory, including children already loaded.
     * @defaultValue `false`
     */
    searchable?: boolean | undefined;
    /** Search on the server instead: resolve the matching paths, root first. */
    search?:
      | ((query: string, signal: AbortSignal) => Promise<readonly (readonly CascaderNode[])[]>)
      | undefined;
    /**
     * The trigger's text for the chosen path's labels.
     * @defaultValue `` (labels) => labels.join(' / ') ``
     */
    displayPath?: ((labels: readonly string[]) => string) | undefined;
    /**
     * The trigger's text while nothing is chosen.
     * @defaultValue `'Select…'`
     */
    placeholder?: string | undefined;
    /** Posts the chosen leaf value under this name, or the whole path when `pathSeparator` is set. */
    name?: string | undefined;
    /** Post the whole path, joined by this, instead of the leaf value. */
    pathSeparator?: string | undefined;
    /** The whole control is unavailable. */
    disabled?: boolean | undefined;
    /**
     * daisyUI size step, for the trigger.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * Names the dialog and the first column when there is no `labelId`.
     * @defaultValue `'Choose'`
     */
    dialogLabel?: string | undefined;
    /**
     * Names a column after its parent's label.
     * @defaultValue `` (parent) => parent ``
     */
    columnLabel?: ((parent: string) => string) | undefined;
    /**
     * The Back button shown below `sm`, beside the open column's parent.
     * @defaultValue `'Back'`
     */
    backLabel?: string | undefined;
    /**
     * Read on a node with children.
     * @defaultValue `'Has subcategories'`
     */
    branchLabel?: string | undefined;
    /**
     * Shown while children or results load.
     * @defaultValue `'Loading…'`
     */
    loadingLabel?: string | undefined;
    /**
     * Shown in a column whose children failed to load; choosing the parent again retries.
     * @defaultValue `'Could not load'`
     */
    loadErrorLabel?: string | undefined;
    /**
     * Shown in a column with no nodes.
     * @defaultValue `'No options'`
     */
    emptyLabel?: string | undefined;
    /**
     * The search field's accessible name.
     * @defaultValue `'Search'`
     */
    searchLabel?: string | undefined;
    /**
     * Shown when a search finds nothing.
     * @defaultValue `'No matches'`
     */
    noResultsLabel?: string | undefined;
    /**
     * Search results kept, at most.
     * @defaultValue `50`
     */
    searchLimit?: number | undefined;
    /** `FieldControl`: the trigger's id, which the `FormField` label names. */
    id?: string | undefined;
    /** `FieldControl`: the label's id; names the dialog and the first column. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error. */
    invalid?: boolean | undefined;
    /** `FieldControl`: sets `aria-required` on the trigger. */
    required?: boolean | undefined;
  }

  let {
    options,
    value = $bindable([]),
    onValueChange,
    loadChildren,
    selectParents = false,
    searchable = false,
    search,
    displayPath = (labels) => labels.join(' / '),
    placeholder = 'Select…',
    name,
    pathSeparator,
    disabled = false,
    size = 'md',
    dialogLabel = 'Choose',
    columnLabel = (parent) => parent,
    backLabel = 'Back',
    branchLabel = 'Has subcategories',
    loadingLabel = 'Loading…',
    loadErrorLabel = 'Could not load',
    emptyLabel = 'No options',
    searchLabel = 'Search',
    noResultsLabel = 'No matches',
    searchLimit = 50,
    id: idProp,
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const columnId = (depth: number): string => `${uid}-column-${depth}`;
  const searchId = `${uid}-search`;
  const branchHintId = `${uid}-branch`;

  /** Children fetched by `loadChildren`, by path. */
  const loaded = new SvelteMap<string, readonly CascaderNode[]>();
  const failed = new SvelteSet<string>();
  let loadingKey: string | undefined = $state();
  let loading: AbortController | undefined;

  const childrenOf: ChildrenOf = (path, node) => node.children ?? loaded.get(pathKey(path));

  let open = $state(false);
  /** The path being browsed, which the columns show; committed on a choice. */
  let draft: string[] = $state([]);
  let focusDepth = $state(0);
  let actives: number[] = $state([]);
  let query = $state('');

  interface Column {
    readonly path: readonly string[];
    readonly parent: CascaderNode | undefined;
    readonly nodes: readonly CascaderNode[];
  }

  const columns = $derived.by(() => {
    const list: Column[] = [{ path: [], parent: undefined, nodes: options }];
    for (const [depth, step] of draft.entries()) {
      const parent = list[depth]?.nodes.find((node) => node.value === step);
      if (parent === undefined || !isBranch(parent)) break;
      const path = draft.slice(0, depth + 1);
      list.push({ path, parent, nodes: childrenOf(path, parent) ?? [] });
    }
    return list;
  });

  const labels = $derived.by(() => {
    const known = resolvePath(options, value, childrenOf).map((node) => node.label);
    return [...known, ...value.slice(known.length)];
  });
  const triggerText = $derived(value.length === 0 ? placeholder : displayPath(labels));
  const posted = $derived(pathSeparator === undefined ? value.at(-1) : value.join(pathSeparator));

  const commit = (path: readonly string[]): void => {
    value = [...path];
    onValueChange?.(value);
  };

  const firstEnabled = (nodes: readonly CascaderNode[]): number =>
    nodes.findIndex((node) => node.disabled !== true);

  /** Focus a column, its active option on the browsed path or its first enabled one. */
  const enter = async (depth: number): Promise<void> => {
    focusDepth = depth;
    const nodes = columns[depth]?.nodes ?? [];
    const onPath = nodes.findIndex((node) => node.value === draft[depth]);
    actives[depth] = onPath >= 0 ? onPath : firstEnabled(nodes);
    await tick();
    document.getElementById(columnId(depth))?.focus();
  };

  /** Once loaded children arrive, a focused column with no active option gets its first. */
  const activateLoaded = (depth: number, nodes: readonly CascaderNode[]): void => {
    if (focusDepth === depth && (actives[depth] ?? -1) < 0) actives[depth] = firstEnabled(nodes);
  };

  const load = async (fetch: NonNullable<Props['loadChildren']>, path: string[]): Promise<void> => {
    const key = pathKey(path);
    const controller = new AbortController();
    loading = controller;
    loadingKey = key;
    failed.delete(key);
    const nodes = await settle(fetch(path, controller.signal));
    // Superseded or aborted: a newer path owns the loading state.
    if (loading !== controller) return;
    loadingKey = undefined;
    if (nodes === undefined) failed.add(key);
    else loaded.set(key, nodes);
    activateLoaded(path.length, nodes ?? []);
  };

  const stopLoading = (): void => {
    loading?.abort();
    loading = undefined;
    loadingKey = undefined;
  };

  const choose = async (depth: number, index: number): Promise<void> => {
    const column = columns[depth];
    const node = column?.nodes[index];
    if (column === undefined || node === undefined || node.disabled === true) return;
    const path = [...column.path, node.value];
    stopLoading();
    draft = path;
    if (!isBranch(node)) {
      commit(path);
      open = false;
      return;
    }
    if (selectParents) commit(path);
    const lazy = childrenOf(path, node) === undefined && loadChildren !== undefined;
    const pending = lazy ? load(loadChildren, path) : undefined;
    await enter(depth + 1);
    await pending;
  };

  const back = (depth: number): void => {
    if (depth > 0) void enter(depth - 1);
  };

  let results: readonly (readonly CascaderNode[])[] = $state.raw([]);
  let searching = $state(false);
  let searchRun: AbortController | undefined;

  const runSearch = async (text: string): Promise<void> => {
    searchRun?.abort();
    if (search === undefined || text.trim() === '') {
      searching = false;
      results = searchTree(options, text, { childrenOf, selectParents, limit: searchLimit });
      return;
    }
    const controller = new AbortController();
    searchRun = controller;
    searching = true;
    try {
      const found = await search(text, controller.signal);
      if (!controller.signal.aborted) results = found.slice(0, searchLimit);
    } catch {
      if (!controller.signal.aborted) results = [];
    }
    if (searchRun === controller) searching = false;
  };

  const chooseResult = (path: readonly CascaderNode[]): void => {
    const values = path.map((node) => node.value);
    commit(values);
    draft = values;
    query = '';
    open = false;
  };

  const onOpenChange = (next: boolean): void => {
    if (next) {
      draft = [...value];
      query = '';
      results = [];
      return;
    }
    stopLoading();
    searchRun?.abort();
  };

  const onOpenAutoFocus = (event: Event): void => {
    event.preventDefault();
    if (searchable) {
      document.getElementById(searchId)?.focus();
      return;
    }
    // The column holding the chosen path's last value, as far as it resolves.
    void enter(Math.max(Math.min(value.length, columns.length) - 1, 0));
  };

  const backTo = $derived(columns[focusDepth]?.parent?.label);

  /** Each column's props, so the template only places them. */
  const columnViews = $derived(
    columns.map((column, depth) => {
      const key = pathKey(column.path);
      const onPath = draft[depth];
      return {
        key,
        depth,
        id: columnId(depth),
        label: column.parent === undefined ? dialogLabel : columnLabel(column.parent.label),
        labelledBy: column.parent === undefined ? labelId : undefined,
        nodes: column.nodes,
        selected: onPath,
        busy: loadingKey === key,
        emptyLabel: failed.has(key) ? loadErrorLabel : emptyLabel,
        current: depth === focusDepth,
      };
    }),
  );

  const setQuery = (next: string): void => {
    query = next;
    void runSearch(next);
  };
</script>

<div {...rest} class={['w-full', className]}>
  <Popover.Root bind:open {onOpenChange}>
    <Popover.Trigger
      {id}
      {disabled}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      aria-invalid={invalid ? 'true' : undefined}
      aria-required={required ? 'true' : undefined}
      class={['select w-full text-start', selectSize[size], invalid && 'select-error']}
    >
      <span class={['truncate', value.length === 0 && 'text-base-content/60']}>{triggerText}</span>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        role="dialog"
        aria-labelledby={labelId}
        aria-label={labelId === undefined ? dialogLabel : undefined}
        sideOffset={4}
        align="start"
        {onOpenAutoFocus}
        class={[
          'bg-base-100 rounded-box border-base-300 z-50 flex max-w-[calc(100vw-2rem)] flex-col gap-2 border p-2 shadow-lg',
          'min-w-(--bits-popover-anchor-width) sm:min-w-0',
        ]}
      >
        <span id={branchHintId} hidden>{branchLabel}</span>
        {#if searchable}
          <CascaderSearch
            id={searchId}
            bind:query={() => query, setQuery}
            {results}
            busy={searching}
            label={searchLabel}
            {loadingLabel}
            {noResultsLabel}
            onChoose={chooseResult}
            onLeave={() => void enter(0)}
          />
        {/if}
        {#if query.trim() === ''}
          {#if backTo !== undefined}
            <div class="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onclick={() => {
                  back(focusDepth);
                }}
              >
                <ChevronLeft class="size-4 rtl:rotate-180" aria-hidden="true" />
                {backLabel}
              </button>
              <span class="truncate text-sm font-semibold">{backTo}</span>
            </div>
          {/if}
          <div class="flex overflow-x-auto">
            {#each columnViews as { key, depth, ...view } (key)}
              <CascaderColumn
                {...view}
                bind:active={() => actives[depth] ?? -1, (next: number) => (actives[depth] = next)}
                {loadingLabel}
                {branchHintId}
                onOpen={(index) => void choose(depth, index)}
                onBack={() => {
                  back(depth);
                }}
              />
            {/each}
          </div>
        {/if}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
  {#if name !== undefined && posted !== undefined}
    <input type="hidden" {name} value={posted} />
  {/if}
</div>
