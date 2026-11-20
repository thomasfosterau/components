<!-- @component
A text field where a trigger character (`@`, `#`, `:`) opens suggestions at the caret; a chosen one becomes a mention stored with a stable id, as `@[Thomas Foster](user:42)`.
-->
<!--
  MentionInput — a plain textarea (or input), so native editing, IME and
  spellcheck all work. The field shows display text; mentions are ranges over
  it, carried across every edit, and written as markup into the bound
  `value`. Editing inside a mention turns it back into text; Backspace right
  after one removes it whole.

  APG combobox with a listbox popup, applied to the token being typed: focus
  never leaves the field (the highlighted option is `aria-activedescendant`),
  so there is no focus management to hand to bits-ui, and its Combobox owns
  the whole value. The popup is placed at the caret by a mirror measurement.
-->
<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import { caretPosition, type CaretPosition } from './caret-position.ts';
  import { inputSize, textareaSize, type FieldSize } from './field-types.ts';
  import {
    activeQuery,
    applyEdit,
    insertMention,
    parseMentions,
    removeMentionBefore,
    serializeMentions,
    type MentionEdit,
    type MentionOption,
    type MentionQuery,
    type MentionToken,
    type MentionTrigger,
  } from './mentions.ts';

  interface Props extends Omit<HTMLTextareaAttributes, 'value' | 'role'> {
    /** The stored text, with mentions as `@[label](id)` markup. Bindable. */
    value?: string | undefined;
    /** The same text as shown, with mentions as their labels. Bindable, read-only. */
    displayValue?: string | undefined;
    /** The trigger characters and where each one's suggestions come from. */
    triggers: readonly MentionTrigger[];
    /**
     * A one-line input instead of a textarea.
     * @defaultValue `false`
     */
    singleLine?: boolean | undefined;
    /** A suggestion's content in the list. */
    option?: Snippet<[MentionOption]> | undefined;
    /**
     * Announced when suggestions arrive.
     * @defaultValue `` (n) => `${n} suggestions` ``
     */
    resultsLabel?: ((count: number) => string) | undefined;
    /**
     * Shown and announced when nothing matches.
     * @defaultValue `'No matches'`
     */
    noResultsLabel?: string | undefined;
    /**
     * Size.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * Whether the value is invalid.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /** Ids of the field's description and errors. */
    describedBy?: string | undefined;
    /** The label's id; the field is named by `<label for>`, so this is accepted and unused. */
    labelId?: string | undefined;
  }

  let {
    value = $bindable(''),
    displayValue = $bindable(''),
    triggers,
    singleLine = false,
    option,
    resultsLabel = (count: number) => `${count} ${count === 1 ? 'suggestion' : 'suggestions'}`,
    noResultsLabel = 'No matches',
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    rows = 3,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const listId = `${uid}-listbox`;
  const optionId = (index: number): string => `${uid}-option-${index}`;
  const chars = $derived(triggers.map((trigger) => trigger.char));

  let text = $state('');
  let mentions = $state.raw<readonly MentionToken[]>([]);
  let written: string | undefined;

  let field: HTMLTextAreaElement | HTMLInputElement | undefined = $state();
  let query = $state.raw<MentionQuery | undefined>();
  let results = $state.raw<readonly MentionOption[] | undefined>();
  let active = $state(0);
  let anchor = $state.raw<CaretPosition | undefined>();
  let status = $state('');
  let composing = false;
  /** The trigger position Escape dismissed; it stays closed until another trigger. */
  let dismissed: number | undefined;
  let searching: AbortController | undefined;

  const open = $derived(query !== undefined && results !== undefined);

  // Read a value set from outside; ignore the one this component just wrote.
  $effect.pre(() => {
    if (value === written) return;
    const parsed = parseMentions(value, chars);
    text = parsed.text;
    mentions = parsed.mentions;
    written = value;
    displayValue = text;
  });

  const emit = (): void => {
    written = serializeMentions(text, mentions, chars);
    value = written;
    displayValue = text;
  };

  const close = (): void => {
    searching?.abort();
    query = undefined;
    results = undefined;
    active = 0;
  };

  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  const announce = (message: string): void => {
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status = message;
    }, 250);
  };
  $effect(() => () => {
    clearTimeout(statusTimer);
    searching?.abort();
  });

  const show = (found: readonly MentionOption[], at: MentionQuery): void => {
    results = found;
    active = 0;
    if (field) anchor = caretPosition(field, at.start);
    announce(found.length === 0 ? noResultsLabel : resultsLabel(found.length));
  };

  const search = async (trigger: MentionTrigger, at: MentionQuery): Promise<void> => {
    searching?.abort();
    const controller = new AbortController();
    searching = controller;
    query = at;
    try {
      const found = await trigger.search(at.query, controller.signal);
      if (!controller.signal.aborted) show(found, at);
    } catch {
      if (!controller.signal.aborted) close();
    }
  };

  const caret = (): number | undefined =>
    field && field.selectionStart === field.selectionEnd ? (field.selectionStart ?? undefined) : undefined;

  const sameQuery = (next: MentionQuery): boolean =>
    query !== undefined && query.start === next.start && query.query === next.query;

  /** The trigger the caret is in, if it has enough characters to search. */
  const triggerAt = (): { trigger: MentionTrigger; at: MentionQuery } | undefined => {
    const position = caret();
    if (composing || position === undefined) return undefined;
    const at = activeQuery(text, position, chars, mentions);
    const trigger = triggers.find((candidate) => candidate.char === at?.char);
    return at && trigger && at.query.length >= (trigger.minChars ?? 0) ? { trigger, at } : undefined;
  };

  /** Open, update or close the suggestions for wherever the caret now is. */
  const refresh = (): void => {
    const found = triggerAt();
    if (found?.at.start !== dismissed) dismissed = undefined;
    if (!found || dismissed !== undefined) {
      close();
      return;
    }
    if (!sameQuery(found.at)) void search(found.trigger, found.at);
  };

  const place = async (edit: MentionEdit): Promise<void> => {
    text = edit.text;
    mentions = edit.mentions;
    emit();
    await tick();
    field?.setSelectionRange(edit.caret, edit.caret);
  };

  const choose = (picked: MentionOption): void => {
    const at = caret();
    const trigger = triggers.find((candidate) => candidate.char === query?.char);
    if (!query || !trigger || at === undefined) return;
    const { start, char } = query;
    close();
    if (trigger.replace) {
      const inserted = trigger.replace(picked);
      const next = text.slice(0, start) + inserted + text.slice(at);
      void place({ text: next, mentions: applyEdit(text, next, mentions), caret: start + inserted.length });
    } else {
      void place(insertMention(text, mentions, start, at, { char, id: picked.id, label: picked.label }));
    }
  };

  const onInput = (): void => {
    if (!field) return;
    const next = field.value;
    mentions = applyEdit(text, next, mentions);
    text = next;
    emit();
    refresh();
  };

  const step = (delta: number, count: number): boolean => {
    active = count === 0 ? 0 : (active + delta + count) % count;
    return true;
  };

  const pick = (found: readonly MentionOption[]): boolean => {
    const picked = found[active];
    if (picked) choose(picked);
    return picked !== undefined;
  };

  const dismiss = (): boolean => {
    dismissed = query?.start;
    close();
    return true;
  };

  /** What each key does while the list is open; `true` when it was handled. */
  const LIST_KEYS: Readonly<Record<string, (found: readonly MentionOption[]) => boolean>> = {
    ArrowDown: (found) => step(1, found.length),
    ArrowUp: (found) => step(-1, found.length),
    Enter: pick,
    Tab: pick,
    Escape: dismiss,
  };

  const listKey = (event: KeyboardEvent, found: readonly MentionOption[]): boolean =>
    LIST_KEYS[event.key]?.(found) ?? false;

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.isComposing || composing) return;
    if (open && results && listKey(event, results)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const at = caret();
    const removal = event.key === 'Backspace' && at !== undefined ? removeMentionBefore(text, mentions, at) : undefined;
    if (removal) {
      event.preventDefault();
      void place(removal);
      close();
    }
  };

  const onCompositionEnd = (): void => {
    composing = false;
    refresh();
  };

  const popupStyle = $derived.by(() => {
    if (!anchor || !field) return undefined;
    const left = Math.max(0, Math.min(anchor.left, field.clientWidth - 224));
    return `position: absolute; z-index: 20; top: ${field.offsetTop + anchor.top + anchor.height}px; left: ${field.offsetLeft + left}px;`;
  });

  const shared = $derived({
    ...rest,
    role: 'combobox',
    'aria-autocomplete': 'list' as const,
    'aria-expanded': open,
    'aria-controls': listId,
    'aria-activedescendant': open && results && results.length > 0 ? optionId(active) : undefined,
    'aria-invalid': invalid ? ('true' as const) : undefined,
    'aria-describedby': describedBy === '' ? undefined : describedBy,
    value: text,
    oninput: onInput,
    onkeydown: onKeydown,
    onkeyup: refresh,
    onclick: refresh,
    onblur: close,
    oncompositionstart: () => {
      composing = true;
    },
    oncompositionend: onCompositionEnd,
  });
</script>

{#snippet defaultOption(item: MentionOption)}
  <span class="block truncate">{item.label}</span>
  {#if item.description}<span class="text-base-content/60 block truncate text-xs">{item.description}</span>{/if}
{/snippet}

<div class="relative" style:position="relative">
  <!-- One element either way; `svelte:element` keeps the attributes a caller passes on whichever it is. -->
  <svelte:element
    this={singleLine ? 'input' : 'textarea'}
    {...shared}
    bind:this={field}
    type={singleLine ? 'text' : undefined}
    rows={singleLine ? undefined : rows}
    class={singleLine
      ? ['input w-full', inputSize[size], invalid && 'input-error', className]
      : ['textarea w-full', textareaSize[size], invalid && 'textarea-error', className]}
  />
  <div
    class="bg-base-100 border-base-300 rounded-box w-56 border p-1 shadow-lg"
    style={popupStyle}
    hidden={!open}
  >
    <ul id={listId} role="listbox" class="max-h-60 overflow-y-auto">
      {#each results ?? [] as item, index (item.id)}
        <!-- Options are never focused (the field keeps focus and points at them), so they take clicks only. -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id={optionId(index)}
          role="option"
          aria-selected={index === active}
          class={['rounded-field cursor-pointer px-2 py-1', index === active && 'bg-base-200']}
          onpointerdown={(event) => event.preventDefault()}
          onclick={() => choose(item)}
        >
          {@render (option ?? defaultOption)(item)}
        </li>
      {/each}
    </ul>
    {#if results?.length === 0}
      <p class="text-base-content/60 px-2 py-1 text-sm">{noResultsLabel}</p>
    {/if}
  </div>
  <VisuallyHidden role="status">{status}</VisuallyHidden>
</div>
