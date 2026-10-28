<!-- @component
A single-select typeahead over a static list or an asynchronous search, on bits-ui’s `Combobox`.
-->
<!--
  Combobox — a single-select typeahead over a static list OR an asynchronous
  search, on bits-ui's `Combobox`.

  The previous generation of this component hand-rolled the APG combobox
  pattern: an `<input role="combobox">`, a `<ul role="listbox">`, an
  `activeIndex`, wrap-around arrow keys, Home/End, and a blur timeout to let a
  pointerdown on an option land before the list closed. All of that is
  bits-ui's here. What is NOT bits-ui's, and is what this file is actually
  about, is the SEARCH LIFECYCLE.

  The search lifecycle (`latest-search.svelte.ts`, shared with `TagsInput`),
  in the order the problems bite:

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

  `postedValue="query"` turns the widget into a search box, and changes two
  things. The `name` moves onto the visible `<input>`, so the form posts the
  typed text, and it does so with JavaScript off because the server-rendered
  input is the posted control. And Enter submits the form unless the reader
  MOVED to an option with the keyboard (`navigated`): bits-ui's
  auto-highlight of the first candidate does not count, so typing a query and
  pressing Enter searches for that query instead of opening the first
  suggestion. Clicking an option still commits it.
-->
<script lang="ts" generics="T">
  import { Combobox } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { inputSize, type FieldSize } from './field-types.ts';
  import { LatestSearch } from './latest-search.svelte.ts';

  /** Keys of the root `<div>`'s attributes that this component claims for itself. */
  type OwnKeys = 'id' | 'class' | 'children';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, OwnKeys> {
    /** The selected item's id. */
    value?: string | undefined;
    /** A static list, filtered here by label. Ignored when `onSearch` is set. */
    items?: readonly T[] | undefined;
    /**
     * Fetch matches for a query. Debounced by `debounceMs`; `signal` aborts
     * when a newer query supersedes this one, so pass it to `fetch`.
     */
    onSearch?: ((query: string, signal: AbortSignal) => Promise<readonly T[]>) | undefined;
    /**
     * Quiet period before a search starts, in milliseconds.
     * @defaultValue `150`
     */
    debounceMs?: number | undefined;
    /** The item's stable id — what `value` holds and what the hidden input posts. */
    getId: (item: T) => string;
    /** The item's human-readable text. */
    getLabel: (item: T) => string;
    /** Optional short chip on the right of a row. */
    getBadge?: ((item: T) => string | undefined) | undefined;
    /** Visible label; names the input. */
    label: string;
    /** Placeholder in the input. */
    placeholder?: string | undefined;
    /**
     * Posted field name. With `postedValue="id"` it renders a hidden input
     * carrying the selected id; with `postedValue="query"` it goes on the
     * visible input, which posts the typed text.
     */
    name?: string | undefined;
    /**
     * What the field under `name` posts: the selected item's id, or the typed
     * query text. `'query'` makes the input itself the posted control (so a
     * plain GET search form works with JavaScript off) and makes Enter submit
     * the form unless the reader arrowed to an option.
     * @defaultValue `'id'`
     */
    postedValue?: 'id' | 'query' | undefined;
    /** Text in the input at mount, such as the current search. A selected item's label wins. */
    initialQuery?: string | undefined;
    /** Called with the raw input text on every keystroke. */
    onQueryChange?: ((query: string) => void) | undefined;
    /** Called with the item the reader committed (click, or Enter on a highlighted row). */
    onSelect?: ((item: T) => void) | undefined;
    /**
     * Shown when a settled search returned nothing.
     * @defaultValue `'No matches'`
     */
    emptyLabel?: string | undefined;
    /**
     * Shown while the first search for a query is in flight.
     * @defaultValue `'Searching…'`
     */
    pendingLabel?: string | undefined;
    /** A caller-owned failure, rendered as an alert under the input. */
    errorMessage?: string | undefined;
    /** `FieldControl`: the input's id. */
    id?: string | undefined;
    /**
     * `FieldControl`: ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — this control is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /** `FieldControl`: the field is in error. */
    invalid?: boolean | undefined;
    /** `FieldControl`: the field must be filled. */
    required?: boolean | undefined;
    /** Disables the input. */
    disabled?: boolean | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** Extra classes on the root, merged last. */
    class?: string | undefined;
    /** Extra classes on the `<input>`, merged last (e.g. daisyUI `join-item`). */
    inputClass?: string | undefined;
    /** Keep the label as the input's accessible name but hide it visually. */
    hideLabel?: boolean | undefined;
    /**
     * Portal the listbox to `<body>`. `false` renders it inside this
     * component's root instead; it still floats over the layout.
     * @defaultValue `true`
     */
    portal?: boolean | undefined;
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
    postedValue = 'id',
    initialQuery,
    onQueryChange,
    onSelect,
    emptyLabel = 'No matches',
    pendingLabel = 'Searching…',
    errorMessage,
    id: idProp,
    describedBy = '',
    labelId: _labelId,
    invalid = false,
    required = false,
    disabled = false,
    size = 'md',
    class: className,
    inputClass,
    hideLabel = false,
    portal = true,
    item,
    footer,
    empty,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(idProp ?? uid);

  // Only the initial value seeds the text; later changes come from typing.
  // svelte-ignore state_referenced_locally
  let query = $state(initialQuery ?? '');
  let open = $state(false);
  const searcher = new LatestSearch<T>(
    () => onSearch,
    () => debounceMs,
  );
  const results = $derived(searcher.results);
  const pending = $derived(searcher.pending);
  const searchError = $derived(searcher.error);
  /** The id of the row bits-ui currently has under the cursor, if any. */
  let highlighted = $state<string | undefined>();
  /** The reader moved the cursor with the keyboard since they last typed. */
  let navigated = false;

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

  /** Seeds bits-ui's input text once, at mount. */
  const initialText = $derived(selectedLabel ?? initialQuery);

  const postsQuery = $derived(postedValue === 'query');

  const visibleError = $derived(errorMessage ?? searchError);

  $effect(() => () => searcher.dispose());

  const typed = (event: Event & { currentTarget: HTMLInputElement }): void => {
    query = event.currentTarget.value;
    navigated = false;
    onQueryChange?.(query);
    if (onSearch === undefined) {
      open = true;
      return;
    }
    if (query.trim() === '') {
      searcher.clear();
      open = false;
      return;
    }
    open = true;
    searcher.schedule(query);
  };

  const navigationKeys = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp']);

  const keydown = (event: KeyboardEvent): void => {
    if (navigationKeys.has(event.key)) {
      navigated = true;
      return;
    }
    if (event.key !== 'Enter') return;
    // In query mode a highlight the reader did not move to is bits-ui's
    // auto-highlight, not a choice: treat it as nothing highlighted.
    const committing = highlighted !== undefined && (!postsQuery || navigated);
    if (committing) return;
    // Nothing to commit. Close first so bits-ui's own Enter branch takes the
    // closed path, which returns without `preventDefault` — that is what lets
    // a wrapping form submit.
    open = false;
  };
</script>

<div {...rest} class={['fieldset w-full', className]}>
  <label class={['label', hideLabel && 'sr-only']} for={inputId}>{label}</label>

  <Combobox.Root
    type="single"
    bind:open
    value={value ?? ''}
    onValueChange={(next) => {
      value = next === '' ? undefined : next;
      if (next === '' || onSelect === undefined) return;
      const chosen = visible.find((entry) => getId(entry) === next);
      if (chosen !== undefined) onSelect(chosen);
    }}
    {disabled}
    {required}
  >
    <Combobox.Input
      id={inputId}
      {...initialText === undefined ? {} : { defaultValue: initialText }}
      {...postsQuery && name !== undefined ? { name } : {}}
      {placeholder}
      autocomplete="off"
      aria-describedby={describedBy === '' ? undefined : describedBy}
      aria-invalid={invalid ? 'true' : undefined}
      oninput={typed}
      onkeydown={keydown}
      class={['input w-full', inputSize[size], invalid && 'input-error', inputClass]}
    />

    <Combobox.Portal disabled={!portal}>
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
    In id mode the posted value is the id, not the typed text: bits-ui's own
    hidden input is not used, because `name` here means "post the selection"
    and nothing else about the widget should depend on it. In query mode the
    visible input above carries `name` instead.
  -->
  {#if name !== undefined && !postsQuery}
    <input type="hidden" {name} value={value ?? ''} />
  {/if}

  {#if visibleError !== undefined}
    <p class="text-error pt-1 text-sm" role="alert">{visibleError}</p>
  {/if}
</div>
