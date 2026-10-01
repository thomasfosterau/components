<!-- @component
The ⌘K / Ctrl+K command palette: bits-ui’s `Command` inside this library’s `Dialog`.
-->
<!--
  CommandPalette — the ⌘K / Ctrl+K palette: bits-ui's `Command` inside this
  library's `Dialog`.

  Two sources of rows, either of which may be absent:

  - **The hotkey registry**, when one is mounted above. `paletteActions` is
    already role-filtered and in registration order, and each row shows its
    trigger as a `HotkeyBadge`, so the palette teaches the keyboard while it
    is used with the mouse. The palette also binds its open state to the
    registry's `paletteOpen`, which is what a registered `$mod+k` action
    toggles.
  - **`items` and `onSearch`**, which need no registry at all. That is what
    makes this usable in an app that wants a palette but not a hotkey system.

  The search lifecycle is `fields/Combobox`'s, for the same reasons: a
  keystroke does not start a request, `debounceMs` of quiet does; each request
  gets an `AbortController` and starting a new one aborts the last, so a slow
  first response cannot overwrite a fast second one; and the previous rows
  stay on screen while the next request is in flight, because clearing on
  every keystroke makes the list strobe and costs the reader the row they were
  about to pick.

  `shouldFilter` is off exactly when `onSearch` is given: async rows are
  already the server's answer to the query, and bits-ui re-filtering them
  would hide rows whose match is in a field the label doesn't show. Without
  `onSearch`, bits-ui's own scoring is better than anything here. Registry and
  `items` rows are filtered locally by label in the async case, so they do not
  outlive the query either.

  ARIA contract: `Dialog`'s (bits-ui: `aria-modal`, the focus trap, Escape,
  the focus return) plus `Command`'s — the input is a `combobox` owning a
  `listbox`, each row an `option`, `aria-activedescendant` follows the arrow
  keys and Enter selects. `label` names the command menu for assistive
  technology and also titles the dialog. The pending row is
  `Command.Loading`, named by `loadingLabel`, so a reader is told the list is
  still settling instead of hearing an empty list.
-->
<script lang="ts">
  import { Command } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import Dialog from '../feedback/Dialog.svelte';
  import HotkeyBadge from '../hotkeys/HotkeyBadge.svelte';
  import { tryGetHotkeyRegistry } from '../hotkeys/context.svelte.ts';
  import type { HotkeyTrigger } from '../hotkeys/types.ts';
  import Badge from '../ui/Badge.svelte';
  import { defaultCommandGroups, type CommandGroup, type CommandItem } from './types.ts';

  interface Props {
    /**
     * Whether the palette is shown. Bindable. Two-way bound to the hotkey
     * registry's `paletteOpen` when a registry is mounted above.
     */
    open?: boolean | undefined;
    /**
     * Names the command menu, and titles the dialog.
     * @defaultValue `'Command palette'`
     */
    label?: string | undefined;
    /**
     * Placeholder in the search field.
     * @defaultValue `'Type a command or search…'`
     */
    placeholder?: string | undefined;
    /**
     * Announced while an `onSearch` request is in flight.
     * @defaultValue `'Searching…'`
     */
    loadingLabel?: string | undefined;
    /**
     * Shown when a settled query matched nothing.
     * @defaultValue `'No results'`
     */
    emptyLabel?: string | undefined;
    /**
     * Accessible name of the dialog's close button.
     * @defaultValue `'Close'`
     */
    closeLabel?: string | undefined;
    /**
     * The sections, in render order. Rows name one by `id`.
     * @defaultValue the exported `defaultCommandGroups`
     */
    groups?: readonly CommandGroup[] | undefined;
    /** Rows that are always available, registry or no registry. */
    items?: readonly CommandItem[] | undefined;
    /**
     * Fetch rows for a query. Debounced by `debounceMs`; `signal` aborts when
     * a newer query supersedes this one, so pass it to `fetch`.
     */
    onSearch?: ((query: string, signal: AbortSignal) => Promise<readonly CommandItem[]>) | undefined;
    /**
     * Quiet period before a search starts, in milliseconds.
     * @defaultValue `150`
     */
    debounceMs?: number | undefined;
    /** Called when a row is activated, before its own `run` / `href`. */
    onSelect?: ((item: CommandItem) => void) | undefined;
    /** Replace a row's contents. */
    item?: Snippet<[CommandItem]> | undefined;
  }

  let {
    open = $bindable(false),
    label = 'Command palette',
    placeholder = 'Type a command or search…',
    loadingLabel = 'Searching…',
    emptyLabel = 'No results',
    closeLabel = 'Close',
    groups = defaultCommandGroups,
    items,
    onSearch,
    debounceMs = 150,
    onSelect,
    item,
  }: Props = $props();

  const context = getComponentsContext();
  const registry = tryGetHotkeyRegistry();

  let query = $state('');
  const trimmedQuery = $derived(query.trim());

  // ── Open state ───────────────────────────────────────────────────
  //
  // With a registry, `paletteOpen` and `open` are two halves of one value:
  // the registered `$mod+k` action writes the registry, a caller may write
  // the prop, and both have to end up agreeing. The trackers below make the
  // sync converge — whichever side changed is copied to the other and both
  // trackers are updated, so the effect's own writes find nothing to do on
  // the re-run.

  let lastOpen = open;
  let lastPaletteOpen = registry?.paletteOpen ?? open;

  $effect(() => {
    if (registry === undefined) return;
    const fromProp = open;
    const fromRegistry = registry.paletteOpen;
    if (fromProp !== lastOpen) {
      lastOpen = fromProp;
      lastPaletteOpen = fromProp;
      registry.paletteOpen = fromProp;
    } else if (fromRegistry !== lastPaletteOpen) {
      lastPaletteOpen = fromRegistry;
      lastOpen = fromRegistry;
      open = fromRegistry;
    }
  });

  // bits-ui's `Dialog` moves focus to the first tabbable child as it opens,
  // which here is the dialog's own close button. A palette has to open with
  // the cursor in its query box — anything else costs the reader a Tab before
  // they can type, and leaves the arrow keys (which `Command` handles on the
  // input) doing nothing. Hence the frame's delay: focusing before the
  // dialog's own focus move would simply be undone.
  let input = $state<HTMLInputElement | null>(null);
  $effect(() => {
    const element = input;
    if (!open || element === null) return;
    const frame = requestAnimationFrame(() => element.focus());
    return () => cancelAnimationFrame(frame);
  });

  const setOpen = (next: boolean): void => {
    open = next;
    // Closing clears the query: a palette that reopens on the last search is
    // a palette that shows yesterday's answer to today's question.
    if (!next) query = '';
  };

  // ── Rows ─────────────────────────────────────────────────────────

  /** A row plus the hotkey chip only a registry action has. */
  interface Row {
    item: CommandItem;
    trigger: HotkeyTrigger | undefined;
  }

  /** In async mode this component owns filtering, so local rows filter here. */
  const matchesQuery = (candidate: CommandItem): boolean => {
    if (onSearch === undefined || trimmedQuery === '') return true;
    return candidate.label.toLowerCase().includes(trimmedQuery.toLowerCase());
  };

  const registryRows = $derived<readonly Row[]>(
    (registry?.paletteActions ?? []).map((entry) => ({
      item: {
        id: entry.action.id,
        label: entry.action.label,
        group: entry.action.group,
        run: entry.action.run,
      },
      trigger: entry.action.trigger,
    })),
  );

  const staticRows = $derived<readonly Row[]>(
    (items ?? []).map((candidate) => ({ item: candidate, trigger: undefined })),
  );

  let results = $state<readonly CommandItem[]>([]);
  const resultRows = $derived<readonly Row[]>(
    results.map((candidate) => ({ item: candidate, trigger: undefined })),
  );

  const rows = $derived(
    [...registryRows, ...staticRows, ...resultRows].filter((row) => matchesQuery(row.item)),
  );

  const sections = $derived(
    groups
      .map((group) => ({ group, rows: rows.filter((row) => row.item.group === group.id) }))
      .filter((section) => section.rows.length > 0),
  );

  // ── Async search ─────────────────────────────────────────────────

  let pending = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: AbortController | undefined;

  const search = (text: string): void => {
    if (onSearch === undefined) return;
    inFlight?.abort();
    const own = new AbortController();
    inFlight = own;
    pending = true;
    void onSearch(text, own.signal)
      .then((next) => {
        // A superseded request must not write: `inFlight` is the identity
        // check, `signal.aborted` catches the caller aborting its own work.
        if (own.signal.aborted || inFlight !== own) return;
        results = next;
        pending = false;
      })
      .catch(() => {
        if (own.signal.aborted || inFlight !== own) return;
        pending = false;
      });
  };

  const cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    inFlight?.abort();
    inFlight = undefined;
  };

  const emit = (text: string): void => {
    if (onSearch === undefined) return;
    if (text === '') {
      cancel();
      pending = false;
      results = [];
      return;
    }
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      search(text);
    }, debounceMs);
  };

  // Emit only while the palette is open; closing it emits `''`, which resets
  // the rows and cancels anything in flight.
  $effect(() => {
    const text = open ? trimmedQuery : '';
    untrack(() => emit(text));
  });

  $effect(() => () => cancel());

  const isEmpty = $derived(trimmedQuery.length > 0 && !pending && sections.length === 0);

  // ── Activation ───────────────────────────────────────────────────

  const activate = (candidate: CommandItem): void => {
    setOpen(false);
    onSelect?.(candidate);
    if (candidate.run !== undefined) void candidate.run();
    if (candidate.href !== undefined) void context.navigate(context.href(candidate.href));
  };
</script>

{#snippet row(entry: Row)}
  <Command.Item
    value={`${entry.item.group}:${entry.item.id}`}
    keywords={[entry.item.label]}
    onSelect={() => activate(entry.item)}
    class="data-selected:bg-base-200 flex cursor-pointer items-center justify-between gap-4 rounded px-3 py-2"
  >
    {#if item}
      {@render item(entry.item)}
    {:else}
      <span class="flex min-w-0 items-baseline gap-2">
        <span class="truncate text-sm">{entry.item.label}</span>
        {#if entry.item.hint !== undefined}
          <span class="text-base-content/60 truncate text-xs">{entry.item.hint}</span>
        {/if}
      </span>
      {#if entry.trigger !== undefined}
        <HotkeyBadge trigger={entry.trigger} />
      {:else if entry.item.badge !== undefined}
        <Badge size="sm">{entry.item.badge}</Badge>
      {/if}
    {/if}
  </Command.Item>
{/snippet}

<Dialog bind:open={() => open, setOpen} title={label} {closeLabel}>
  <Command.Root shouldFilter={onSearch === undefined} loop {label} class="flex flex-col">
    <Command.Input
      bind:ref={input}
      bind:value={query}
      {placeholder}
      class="input border-base-300 w-full rounded-none border-0 border-b focus:outline-none"
    />
    <Command.List class="max-h-96 overflow-x-hidden overflow-y-auto pt-2">
      <Command.Viewport>
        {#each sections as section (section.group.id)}
          <Command.Group value={section.group.id}>
            <Command.GroupHeading
              class="text-base-content/70 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase"
            >
              {section.group.label}
            </Command.GroupHeading>
            <Command.GroupItems>
              {#each section.rows as entry (`${entry.item.group}:${entry.item.id}`)}
                {@render row(entry)}
              {/each}
            </Command.GroupItems>
          </Command.Group>
        {/each}

        {#if pending && trimmedQuery.length > 0}
          <!-- Through `child` so `aria-label` lands AFTER bits-ui's own
               props: `Command.Loading` hard-codes the English "Loading...",
               and in this library the name of anything is a prop. -->
          <Command.Loading>
            {#snippet child({ props })}
              <div {...props} aria-label={loadingLabel} class="text-base-content/60 px-3 py-2 text-sm">
                {loadingLabel}
              </div>
            {/snippet}
          </Command.Loading>
        {/if}

        {#if isEmpty}
          <p class="text-base-content/60 px-3 py-6 text-center text-sm">{emptyLabel}</p>
        {/if}
      </Command.Viewport>
    </Command.List>
  </Command.Root>
</Dialog>
