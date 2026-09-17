<!--
  Combobox — a single-select typeahead over a static list OR an asynchronous
  search, on bits-ui's `Combobox`.

  The previous generation of this component hand-rolled the APG combobox
  pattern: an `<input role="combobox">`, a `<ul role="listbox">`, an
  `activeIndex`, wrap-around arrow keys, Home/End, and a blur timeout to let a
  pointerdown on an option land before the list closed. All of that is
  bits-ui's here. What is NOT bits-ui's, and is what this file is actually
  about, is the SEARCH LIFECYCLE.

  The search lifecycle, in the order the problems bite:

    debounce         a keystroke does not start a request; `debounceMs` of
                     quiet does.
    latest-wins      each request gets an `AbortController`, and starting a
                     new one aborts the last. A superseded request is
                     cancelled rather than merely ignored, so a slow first
                     response cannot overwrite a fast second one.
    stale-while-     the previous results stay on screen while the next
      revalidate     request is in flight, with `pending` true. Clearing the
                     list on every keystroke makes the dropdown strobe and
                     costs the reader the thing they were about to pick.

  ARIA contract: bits-ui gives the input `role="combobox"`,
  `aria-autocomplete="list"`, `aria-expanded` and `aria-activedescendant`
  pointing at the highlighted option; the panel is `role="listbox"` and each
  row `role="option"` with `aria-selected`. The visible `<label>` names the
  input through `for`/`id`; `errorMessage` is a `role="alert"` paragraph the
  input is NOT described by, because a search failure is about the list rather
  than about the value.

  One behaviour is preserved from the hand-rolled version on purpose:
  **Enter with nothing highlighted must not prevent a wrapping `<form>` from
  submitting.** A search box that sits in a plain GET form has to keep working
  when the list is empty or the reader never opened it. bits-ui's input
  `preventDefault`s Enter whenever the panel is open, so the handler below
  closes the panel first when nothing is highlighted: with the panel closed,
  bits-ui treats Enter as an interaction key and returns without touching the
  event, and the form submits. `highlighted` is tracked through the items'
  own `onHighlight` / `onUnhighlight` callbacks, which is the only place
  bits-ui surfaces it.

  Note what that means in practice: bits-ui puts the cursor on the first
  candidate as soon as typing produces one, so with matches on screen Enter
  COMMITS. The fall-through happens where it matters — a query that matched
  nothing, or a panel the reader never opened — which is exactly the case a
  no-JS search form depends on.
-->
<script lang="ts" generics="T">
  import { Combobox } from 'bits-ui';
  import clsx from 'clsx';
  import type { Snippet } from 'svelte';
  import { inputSize, type FieldSize } from './field-types.ts';

  interface Props {
    /** The selected item's id. */
    value?: string | undefined;
    /** A static list, filtered here by label. Ignored when `onSearch` is set. */
    items?: readonly T[] | undefined;
    /**
     * Fetch matches for a query. Debounced by `debounceMs`; `signal` aborts
     * when a newer query supersedes this one, so pass it to `fetch`.
     */
    onSearch?: ((query: string, signal: AbortSignal) => Promise<readonly T[]>) | undefined;
    /** Quiet period before a search starts, in milliseconds. */
    debounceMs?: number | undefined;
    /** The item's stable id — what `value` holds and what the hidden input posts. */
    getId: (item: T) => string;
    /** The item's human-readable text. */
    getLabel: (item: T) => string;
    /** Optional short chip on the right of a row. */
    getBadge?: ((item: T) => string | undefined) | undefined;
    /** Visible label; names the input. */
    label: string;
    placeholder?: string | undefined;
    /** Posted field name. Set it to render a hidden input carrying the id. */
    name?: string | undefined;
    /** Shown when a settled search returned nothing. */
    emptyLabel?: string | undefined;
    /** Shown while the first search for a query is in flight. */
    pendingLabel?: string | undefined;
    /** A caller-owned failure, rendered as an alert under the input. */
    errorMessage?: string | undefined;
    /** `FieldControl`: the input's id. */
    id?: string | undefined;
    /** `FieldControl`: ids for `aria-describedby`. */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error. */
    invalid?: boolean | undefined;
    /** `FieldControl`: the field must be filled. */
    required?: boolean | undefined;
    disabled?: boolean | undefined;
    size?: FieldSize | undefined;
    class?: string | undefined;
    /** Replace a row's contents. */
    item?: Snippet<[T]> | undefined;
    /** Rendered after the rows — a "create this" row, a "see all" link. */
    footer?: Snippet<[{ query: string; pending: boolean }]> | undefined;
    /** Replaces `emptyLabel` when a settled search returned nothing. */
    empty?: Snippet<[{ query: string }]> | undefined;
  }

  let {
    value = $bindable(),
    items,
    onSearch,
    debounceMs = 150,
    getId,
    getLabel,
    getBadge,
    label,
    placeholder,
    name,
    emptyLabel = 'No matches',
    pendingLabel = 'Searching…',
    errorMessage,
    id: idProp,
    describedBy = '',
    invalid = false,
    required = false,
    disabled = false,
    size = 'md',
    class: className,
    item,
    footer,
    empty,
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(idProp ?? uid);

  let query = $state('');
  let open = $state(false);
  let results = $state<readonly T[]>([]);
  let pending = $state(false);
  let searchError = $state<string | undefined>();
  /** The id of the row bits-ui currently has under the cursor, if any. */
  let highlighted = $state<string | undefined>();

  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: AbortController | undefined;

  /** Static mode filters locally; async mode shows whatever last settled. */
  const visible = $derived.by(() => {
    if (onSearch !== undefined) return results;
    const all = items ?? [];
    const needle = query.trim().toLowerCase();
    if (needle === '') return all;
    return all.filter((entry) => getLabel(entry).toLowerCase().includes(needle));
  });

  const selectedLabel = $derived.by(() => {
    if (value === undefined || items === undefined) return undefined;
    const match = items.find((entry) => getId(entry) === value);
    return match === undefined ? undefined : getLabel(match);
  });

  const visibleError = $derived(errorMessage ?? searchError);

  const search = (text: string): void => {
    if (onSearch === undefined) return;
    inFlight?.abort();
    const own = new AbortController();
    inFlight = own;
    pending = true;
    searchError = undefined;
    void onSearch(text, own.signal)
      .then((next) => {
        // A superseded request must not write: `inFlight` is the identity
        // check, `signal.aborted` catches the caller aborting its own work.
        if (own.signal.aborted || inFlight !== own) return;
        results = next;
        pending = false;
      })
      .catch((error: unknown) => {
        if (own.signal.aborted || inFlight !== own) return;
        pending = false;
        searchError = error instanceof Error ? error.message : String(error);
      });
  };

  const schedule = (text: string): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      search(text);
    }, debounceMs);
  };

  $effect(() => () => {
    if (timer !== undefined) clearTimeout(timer);
    inFlight?.abort();
  });

  const typed = (event: Event & { currentTarget: HTMLInputElement }): void => {
    query = event.currentTarget.value;
    if (onSearch === undefined) {
      open = true;
      return;
    }
    if (query.trim() === '') {
      if (timer !== undefined) clearTimeout(timer);
      inFlight?.abort();
      inFlight = undefined;
      pending = false;
      results = [];
      open = false;
      return;
    }
    open = true;
    schedule(query);
  };

  const keydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || highlighted !== undefined) return;
    // Nothing to commit. Close first so bits-ui's own Enter branch takes the
    // closed path, which returns without `preventDefault` — that is what lets
    // a wrapping form submit.
    open = false;
  };
</script>

<div class={['fieldset w-full', className]}>
  <label class="label" for={inputId}>{label}</label>

  <Combobox.Root
    type="single"
    bind:open
    value={value ?? ''}
    onValueChange={(next) => {
      value = next === '' ? undefined : next;
    }}
    {disabled}
    {required}
  >
    <Combobox.Input
      id={inputId}
      {...selectedLabel === undefined ? {} : { defaultValue: selectedLabel }}
      {placeholder}
      autocomplete="off"
      aria-describedby={describedBy === '' ? undefined : describedBy}
      aria-invalid={invalid ? 'true' : undefined}
      oninput={typed}
      onkeydown={keydown}
      class={clsx('input w-full', inputSize[size], invalid && 'input-error')}
    />

    <Combobox.Portal>
      <Combobox.Content
        sideOffset={4}
        class="menu bg-base-100 rounded-box border-base-300 z-50 max-h-72 min-w-64 overflow-auto border p-2 shadow-md"
      >
        <Combobox.Viewport>
          {#each visible as entry (getId(entry))}
            {@const entryId = getId(entry)}
            {@const badge = getBadge?.(entry)}
            <Combobox.Item
              value={entryId}
              label={getLabel(entry)}
              onHighlight={() => (highlighted = entryId)}
              onUnhighlight={() => {
                if (highlighted === entryId) highlighted = undefined;
              }}
              class="rounded-field data-highlighted:bg-base-200 data-disabled:opacity-50 flex cursor-pointer items-center justify-between gap-3 px-3 py-2"
            >
              {#if item}
                {@render item(entry)}
              {:else}
                <span>{getLabel(entry)}</span>
                {#if badge !== undefined}
                  <span class="badge badge-ghost badge-sm">{badge}</span>
                {/if}
              {/if}
            </Combobox.Item>
          {/each}

          {#if visible.length === 0}
            {#if pending}
              <p class="fieldset-label px-3 py-2">{pendingLabel}</p>
            {:else if empty}
              {@render empty({ query })}
            {:else}
              <p class="fieldset-label px-3 py-2">{emptyLabel}</p>
            {/if}
          {/if}

          {#if footer}
            {@render footer({ query, pending })}
          {/if}
        </Combobox.Viewport>
      </Combobox.Content>
    </Combobox.Portal>
  </Combobox.Root>

  <!--
    The posted value is the id, not the typed text: bits-ui's own hidden input
    is not used, because `name` here means "post the selection" and nothing
    else about the widget should depend on it.
  -->
  {#if name !== undefined}
    <input type="hidden" {name} value={value ?? ''} />
  {/if}

  {#if visibleError !== undefined}
    <p class="text-error pt-1 text-sm" role="alert">{visibleError}</p>
  {/if}
</div>
