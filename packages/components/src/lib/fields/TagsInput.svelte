<!-- @component
An open-ended list of short strings the reader types — tags, aliases, keywords — each a removable chip, with optional suggestions.
-->
<!--
  TagsInput — type and press Enter (or a delimiter such as `,`) to commit a
  tag; each tag renders as a chip with a remove button; Backspace in an empty
  input reaches back into the tags. Optional suggestions, from a static list
  or an async search, appear in a listbox.

  Hand-rolled, and why (AGENTS.md: bits-ui owns interaction): bits-ui 2.20
  has no tags input, and the token list plus one text input is a small
  keyboard model, pinned key by key in `tests/fields/TagsInput.test.ts`. The
  SUGGESTION half is not hand-rolled: with `suggestions` or `onSearch` the
  text input is bits-ui's `Combobox` input, and the async lifecycle
  (debounce, latest-wins, stale-while-revalidate) is the one `Combobox`
  uses, `latest-search.svelte.ts`. Without either, no bits-ui is rendered.

  ARIA contract (a composition — there is no single APG pattern): a
  `role="list"` of tags, each `role="listitem"` holding its text and a
  remove `<button>` named by `removeLabel(tag)`; then the text input, which
  carries the `FieldControl` id (so `FormField`'s `<label for>` names it),
  `aria-describedby` and `aria-invalid`, and is a combobox
  (`aria-expanded`, `aria-controls`, `aria-activedescendant`) when
  suggestions are on. The tag list is not folded into the description: adds
  and removes reach assistive technology through a polite live region
  (`addedMessage` / `removedMessage`).

  Keyboard, in the text input: Enter or a delimiter commits the text (or, with
  a suggestion highlighted, that suggestion; Enter on an empty input is left
  alone so a wrapping form can submit); Backspace with empty text focuses the
  last tag's remove button, and a second Backspace removes it; Arrow Left with
  the caret at the start does the same move; Arrow Up / Down walk the
  suggestions; a paste containing delimiters is split into one tag each. On a
  remove button: Arrow Left / Right move between tags (Right past the last
  returns to the input); Delete / Backspace / Enter / Space remove the tag.
  Focus is never lost after a removal: it lands on the tag that took its
  place, else the one before, else the input.

  `required` means "at least one tag": the text input is `required` (so the
  browser blocks submission) only while there are no tags, and
  `aria-required` throughout. `max` disables the input at the cap. `name`
  posts one hidden input per tag.
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import { Combobox } from 'bits-ui';
  import { tick, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { inputSize, type FieldSize } from './field-types.ts';
  import { LatestSearch } from './latest-search.svelte.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
    /**
     * The tags. Bindable.
     * @defaultValue `[]`
     */
    values?: string[] | undefined;
    /** Posts each tag under this name, one hidden input per tag. */
    name?: string | undefined;
    /**
     * Characters that commit the current text as a tag, besides Enter; a paste is split on them too.
     * @defaultValue `[',']`
     */
    delimiters?: readonly string[] | undefined;
    /**
     * Normalise or refuse a candidate; return `undefined` to refuse it.
     * @defaultValue trims, and refuses an empty string
     */
    normalise?: ((text: string) => string | undefined) | undefined;
    /**
     * Allow a tag already present (compared case-insensitively after `normalise`).
     * @defaultValue `false`
     */
    allowDuplicates?: boolean | undefined;
    /** Cap on the number of tags; the input disables at the cap. */
    max?: number | undefined;
    /** Static suggestions, filtered by the typed text. */
    suggestions?: readonly string[] | undefined;
    /** Async suggestions, debounced and latest-wins; `signal` aborts a superseded search. */
    onSearch?: ((query: string, signal: AbortSignal) => Promise<readonly string[]>) | undefined;
    /**
     * Quiet time before `onSearch` runs.
     * @defaultValue `150`
     */
    debounceMs?: number | undefined;
    /**
     * Placeholder in the text input.
     * @defaultValue `'Add a tag'`
     */
    placeholder?: string | undefined;
    /**
     * Accessible name of a tag's remove button.
     * @defaultValue `(tag) => \`Remove ${tag}\``
     */
    removeLabel?: ((tag: string) => string) | undefined;
    /**
     * Live-region text after a tag is added.
     * @defaultValue `(tag) => \`${tag} added\``
     */
    addedMessage?: ((tag: string) => string) | undefined;
    /**
     * Live-region text after a tag is removed.
     * @defaultValue `(tag) => \`${tag} removed\``
     */
    removedMessage?: ((tag: string) => string) | undefined;
    /** Renders one tag's body; defaults to its text. */
    tag?: Snippet<[string]> | undefined;
    /**
     * Disables the input and every remove button.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the text input's `id`, which `FormField`'s label points at. Minted when omitted. */
    id?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — the text input is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for the input's `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and `input-error`.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: at least one tag is required.
     * @defaultValue `false`
     */
    required?: boolean | undefined;
  }

  let {
    values = $bindable([]),
    name,
    delimiters = [','],
    normalise = (text: string) => (text.trim() === '' ? undefined : text.trim()),
    allowDuplicates = false,
    max,
    suggestions,
    onSearch,
    debounceMs = 150,
    placeholder = 'Add a tag',
    removeLabel = (tag: string) => `Remove ${tag}`,
    addedMessage = (tag: string) => `${tag} added`,
    removedMessage = (tag: string) => `${tag} removed`,
    tag: tagBody,
    disabled = false,
    size = 'md',
    id: idProp,
    labelId: _labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(idProp ?? uid);

  let text = $state('');
  let announcement = $state('');
  let open = $state(false);
  /** The suggestion bits-ui currently has under the cursor, if any. */
  let highlighted = $state<string | undefined>();
  let input = $state<HTMLInputElement | null>(null);
  const removeButtons: (HTMLButtonElement | null)[] = $state([]);

  const searcher = new LatestSearch<string>(
    () => onSearch,
    () => debounceMs,
  );
  $effect(() => () => searcher.dispose());

  const suggesting = $derived(suggestions !== undefined || onSearch !== undefined);
  const full = $derived(max !== undefined && values.length >= max);
  const present = $derived(new Set(values.map((value) => value.toLowerCase())));
  const visible = $derived.by(() => {
    const pool = onSearch === undefined ? (suggestions ?? []) : searcher.results;
    const needle = text.trim().toLowerCase();
    return pool.filter(
      (entry) =>
        !present.has(entry.toLowerCase()) &&
        (onSearch !== undefined || entry.toLowerCase().includes(needle)),
    );
  });

  /** What both the plain and the combobox input carry. */
  const inputProps = $derived({
    id: inputId,
    placeholder,
    autocomplete: 'off' as const,
    disabled: disabled || full,
    required: required && values.length === 0,
    'aria-required': required ? ('true' as const) : undefined,
    'aria-describedby': describedBy === '' ? undefined : describedBy,
    'aria-invalid': invalid ? ('true' as const) : undefined,
    class: 'min-w-24 grow',
  });

  /** Add `raw` as a tag if `normalise`, the duplicate rule and `max` allow it. */
  function add(raw: string): boolean {
    if (full) return false;
    const candidate = normalise(raw);
    if (candidate === undefined) return false;
    if (!allowDuplicates && present.has(candidate.toLowerCase())) return false;
    values = [...values, candidate];
    announcement = addedMessage(candidate);
    return true;
  }

  function clearText(): void {
    text = '';
    if (input !== null) input.value = '';
    searcher.clear();
    open = false;
  }

  function commitText(): void {
    if (add(text)) clearText();
  }

  async function remove(index: number): Promise<void> {
    const removed = values[index];
    if (removed === undefined) return;
    values = values.filter((_, at) => at !== index);
    announcement = removedMessage(removed);
    await tick();
    (removeButtons[index] ?? removeButtons[index - 1] ?? input)?.focus();
  }

  function focusTag(index: number): void {
    (removeButtons[index] ?? input)?.focus();
  }

  function typed(event: Event & { currentTarget: HTMLInputElement }): void {
    text = event.currentTarget.value;
    if (!suggesting) return;
    open = text.trim() !== '';
    if (onSearch === undefined) return;
    if (open) searcher.schedule(text);
    else searcher.clear();
  }

  /** Enter commits the text, unless a suggestion is highlighted (bits-ui's) or there is no text (the form's). */
  function enterKey(event: KeyboardEvent): void {
    if ((open && highlighted !== undefined) || text.trim() === '') return;
    event.preventDefault();
    commitText();
  }

  /** Backspace in an empty input, or Arrow Left at its start, moves into the tags. */
  function reachesTags(event: KeyboardEvent): boolean {
    if (values.length === 0) return false;
    if (event.key === 'Backspace') return text === '';
    const target = event.currentTarget as HTMLInputElement;
    return event.key === 'ArrowLeft' && target.selectionStart === 0 && target.selectionEnd === 0;
  }

  function inputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      enterKey(event);
    } else if (delimiters.includes(event.key)) {
      event.preventDefault();
      commitText();
    } else if (reachesTags(event)) {
      event.preventDefault();
      focusTag(values.length - 1);
    }
  }

  function paste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text/plain') ?? '';
    const separators = [...delimiters, '\n'];
    if (!separators.some((separator) => pasted.includes(separator))) return;
    event.preventDefault();
    const pieces = separators.reduce<string[]>(
      (parts, separator) => parts.flatMap((part) => part.split(separator)),
      [`${text}${pasted}`],
    );
    for (const piece of pieces) add(piece);
    clearText();
  }

  const removeKeys = new Set(['Delete', 'Backspace']);

  function tagKeydown(event: KeyboardEvent, index: number): void {
    if (removeKeys.has(event.key)) {
      event.preventDefault();
      void remove(index);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTag(Math.max(0, index - 1));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTag(index + 1);
    }
  }

  /** A suggestion was chosen. bits-ui writes the item's label into the input after this returns, so clear on the next tick. */
  function pick(next: string): void {
    if (next === '') return;
    add(next);
    void tick().then(clearText);
  }
</script>

<div
  {...rest}
  class={[
    'input h-auto min-h-(--size) w-full flex-wrap items-center gap-1 py-1',
    inputSize[size],
    invalid && 'input-error',
    className,
  ]}
>
  {#if values.length > 0}
    <ul role="list" class="flex flex-wrap gap-1">
      {#each values as value, index (`${index}:${value}`)}
        <li class="badge badge-soft gap-1 pe-0">
          {#if tagBody}{@render tagBody(value)}{:else}<span>{value}</span>{/if}
          <button
            bind:this={removeButtons[index]}
            type="button"
            {disabled}
            class="btn btn-circle btn-ghost btn-xs"
            onclick={() => void remove(index)}
            onkeydown={(event) => tagKeydown(event, index)}
          >
            <X class="size-3" aria-hidden="true" />
            <span class="sr-only">{removeLabel(value)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if suggesting}
    <Combobox.Root
      type="single"
      bind:open
      bind:value={() => '', pick}
      inputValue={text}
      {disabled}
    >
      <Combobox.Input {...inputProps} bind:ref={input} oninput={typed} onkeydown={inputKeydown} onpaste={paste} />
      <Combobox.Portal>
        <Combobox.Content
          sideOffset={4}
          class="menu bg-base-100 rounded-box border-base-300 z-50 max-h-72 min-w-48 overflow-auto border p-2 shadow-md"
        >
          <Combobox.Viewport>
            {#each visible as entry (entry)}
              <Combobox.Item
                value={entry}
                label={entry}
                onHighlight={() => (highlighted = entry)}
                onUnhighlight={() => {
                  if (highlighted === entry) highlighted = undefined;
                }}
                class="rounded-field data-highlighted:bg-base-200 cursor-pointer px-3 py-2"
              >
                {entry}
              </Combobox.Item>
            {/each}
          </Combobox.Viewport>
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox.Root>
  {:else}
    <input {...inputProps} bind:this={input} type="text" oninput={typed} onkeydown={inputKeydown} onpaste={paste} />
  {/if}

  {#if name !== undefined}
    {#each values as value, index (`${index}:${value}`)}
      <input type="hidden" {name} {value} {disabled} />
    {/each}
  {/if}
  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
