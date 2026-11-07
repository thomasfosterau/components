<!-- @component
An always-visible list of options to choose one or several from, as a form field: the APG listbox, one tab stop, with typeahead and range selection.
-->
<!--
  Listbox — a bordered, scrolling list of options shown inline, without a
  popover: 20 to a few hundred choices visible and scannable at once, where
  a `CheckboxGroup` would be one tab stop per option and a `Select` hides
  them behind a popup.

  Hand-rolled, deliberately (the exception AGENTS.md asks a reason for):
  bits-ui 2.20 has no standalone listbox — its listbox lives inside `Select`
  and `Combobox`, both tied to a popover — and the WAI-ARIA APG listbox
  pattern this follows is fully specified.

  ARIA and keyboard contract (APG listbox):
  - The container is `role="listbox"` and the single tab stop, named by the
    `FormField` label through `labelId` (`aria-labelledby`; a `<label for>`
    cannot name a `<div>`), with `aria-describedby`, `aria-invalid`,
    `aria-required` and, in multiple mode, `aria-multiselectable`. Focus
    stays on the container; the active option is `aria-activedescendant`
    and is scrolled into view.
  - Options are `role="option"` with `aria-selected`; a disabled option is
    `aria-disabled`, visible, and skipped by navigation. Options carrying a
    `group` sit in a `role="group"` named by its heading.
  - Single: ↑/↓ and Home/End move and select (selection follows focus);
    typing moves to the next option starting with the typed text.
  - Multiple, `selectionModel="recommended"`: ↑/↓ move without selecting,
    Space toggles, Shift+↑/↓ extends, Shift+Space selects the range from the
    last toggled option, Ctrl/⌘+A selects every enabled option, and
    Ctrl/⌘+Shift+Home/End selects to the first / last. A click selects only
    that option, Ctrl/⌘-click toggles it, Shift-click selects a range.
  - Multiple, `selectionModel="toggle"` (touch-first): a click or Space
    toggles, with no modifier semantics.
  - Selected options carry a check icon as well as their tint, so selection
    is never colour alone.

  `values` is always kept in `options` order. `name` posts one hidden input
  per selected value (a single hidden input in single mode, and nothing at
  all while nothing is selected).

  Large lists: every option is in the DOM, so keep `options` to a few
  hundred; a virtualised listbox is #209's.
-->
<script lang="ts">
  import { Check } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { toFieldOptions, type FieldOption, type FieldSize } from './field-types.ts';

  /** A `Listbox` option: a `FieldOption`, optionally under a `group` heading. */
  interface ListboxOption extends FieldOption {
    /** The heading of the group this option is listed under. */
    readonly group?: string | undefined;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
    /** Full options (optionally grouped), or bare strings when value and label are the same. */
    options: readonly (ListboxOption | string)[];
    /**
     * Choose several. The selection is then `values`; otherwise `value`.
     * @defaultValue `false`
     */
    multiple?: boolean | undefined;
    /** Single mode: the selected value, or `undefined`. Bindable. */
    value?: string | undefined;
    /**
     * Multiple mode: the selected values, in option order. Bindable.
     * @defaultValue `[]`
     */
    values?: string[] | undefined;
    /** Called with the new selection: a value in single mode, the values in multiple mode. */
    onValueChange?: ((selection: string | readonly string[] | undefined) => void) | undefined;
    /** A richer option body; the label is rendered when omitted. */
    option?: Snippet<[FieldOption, { selected: boolean }]> | undefined;
    /**
     * Rows visible before the list scrolls.
     * @defaultValue `8`
     */
    rows?: 4 | 6 | 8 | 10 | 12 | undefined;
    /**
     * The multiple-selection keyboard and pointer model.
     * @defaultValue `'recommended'`
     */
    selectionModel?: 'recommended' | 'toggle' | undefined;
    /**
     * Shown when there are no options.
     * @defaultValue `'No options'`
     */
    emptyLabel?: string | undefined;
    /** Posts the selection under this name, one hidden input per value. */
    name?: string | undefined;
    /** The whole control is unavailable. */
    disabled?: boolean | undefined;
    /**
     * daisyUI size step, for the option text.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the label's id; names the listbox through `aria-labelledby`. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error border. */
    invalid?: boolean | undefined;
    /** `FieldControl`: sets `aria-required`. */
    required?: boolean | undefined;
  }

  let {
    options,
    multiple = false,
    value = $bindable(undefined),
    values = $bindable([]),
    onValueChange,
    option,
    rows = 8,
    selectionModel = 'recommended',
    emptyLabel = 'No options',
    name,
    disabled = false,
    size = 'md',
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

  const rowsClass: Record<NonNullable<Props['rows']>, string> = {
    4: 'max-h-40',
    6: 'max-h-60',
    8: 'max-h-80',
    10: 'max-h-100',
    12: 'max-h-120',
  };

  const textSize: Record<FieldSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const entries = $derived(
    options.map((entry): ListboxOption =>
      typeof entry === 'string' ? (toFieldOptions([entry])[0] ?? { value: entry, label: entry }) : entry,
    ),
  );

  /** The options as rendered: ungrouped first, then each group in first-seen order. */
  const sections = $derived.by(() => {
    const ungrouped: ListboxOption[] = [];
    const groups = new Map<string, ListboxOption[]>();
    for (const entry of entries) {
      if (entry.group === undefined) {
        ungrouped.push(entry);
        continue;
      }
      const list = groups.get(entry.group) ?? [];
      list.push(entry);
      groups.set(entry.group, list);
    }
    return { ungrouped, groups: [...groups.entries()] };
  });

  /** Every option in rendered order: the order navigation walks. */
  const ordered = $derived([
    ...sections.ungrouped,
    ...sections.groups.flatMap(([, list]) => list),
  ]);

  const optionId = (index: number): string => `${id}-option-${index}`;
  const groupId = (index: number): string => `${id}-group-${index}`;
  const indexOf = (entry: ListboxOption): number => ordered.indexOf(entry);

  let active = $state(-1);
  /** Where a Shift range starts: the option last toggled or selected alone. */
  let anchor = $state(-1);
  let listbox: HTMLDivElement | undefined = $state();

  const isSelected = (entry: ListboxOption): boolean =>
    multiple ? values.includes(entry.value) : value === entry.value;
  const enabled = (index: number): boolean => ordered[index]?.disabled !== true;

  /** Commit a multiple selection, kept in option order. */
  const commitValues = (next: ReadonlySet<string>): void => {
    values = ordered.filter((entry) => next.has(entry.value)).map((entry) => entry.value);
    onValueChange?.(values);
  };

  const commitValue = (next: string): void => {
    if (value === next) return;
    value = next;
    onValueChange?.(next);
  };

  const toggle = (index: number): void => {
    const entry = ordered[index];
    if (entry === undefined || !enabled(index)) return;
    const next = new Set(values);
    if (next.has(entry.value)) next.delete(entry.value);
    else next.add(entry.value);
    anchor = index;
    commitValues(next);
  };

  /** Select the enabled options between `anchor` and `to`, inclusive, on top of `keep`. */
  const selectRange = (to: number, keep: readonly string[] = []): void => {
    const from = anchor < 0 ? to : anchor;
    const [low, high] = from <= to ? [from, to] : [to, from];
    const next = new Set(keep);
    for (let index = low; index <= high; index += 1) {
      const entry = ordered[index];
      if (entry !== undefined && enabled(index)) next.add(entry.value);
    }
    commitValues(next);
  };

  const selectOnly = (index: number): void => {
    const entry = ordered[index];
    if (entry === undefined || !enabled(index)) return;
    anchor = index;
    if (multiple) commitValues(new Set([entry.value]));
    else commitValue(entry.value);
  };

  /** The nearest enabled option from `start` in `step` direction, or `start`'s own if none. */
  const nextEnabled = (start: number, step: 1 | -1): number => {
    for (let index = start; index >= 0 && index < ordered.length; index += step) {
      if (enabled(index)) return index;
    }
    return active;
  };

  const moveTo = (index: number): void => {
    if (index < 0 || index >= ordered.length) return;
    active = index;
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
  };

  let typed = '';
  let typedAt = 0;

  /** Typeahead: the next enabled option whose label starts with what was typed. */
  const typeahead = (key: string): void => {
    const now = Date.now();
    typed = now - typedAt > 500 ? key : typed + key;
    typedAt = now;
    const query = typed.toLowerCase();
    const count = ordered.length;
    // A repeated single letter cycles; a longer query re-checks from the current one.
    const offset = typed.length === 1 ? 1 : 0;
    for (let step = 0; step < count; step += 1) {
      const index = (Math.max(active, 0) + offset + step) % count;
      const entry = ordered[index];
      if (entry !== undefined && enabled(index) && entry.label.toLowerCase().startsWith(query)) {
        moveTo(index);
        if (!multiple) selectOnly(index);
        return;
      }
    }
  };

  const onkeydown = (event: KeyboardEvent): void => {
    if (disabled || ordered.length === 0) return;
    const mod = event.ctrlKey || event.metaKey;
    const recommended = multiple && selectionModel === 'recommended';
    const from = active < 0 ? -1 : active;
    let target: number | undefined;

    switch (event.key) {
      case 'ArrowDown':
        target = nextEnabled(from + 1, 1);
        break;
      case 'ArrowUp':
        target = nextEnabled(Math.max(from - 1, 0), -1);
        break;
      case 'Home':
        target = nextEnabled(0, 1);
        break;
      case 'End':
        target = nextEnabled(ordered.length - 1, -1);
        break;
      case ' ':
        event.preventDefault();
        if (active < 0) return;
        if (!multiple) selectOnly(active);
        else if (recommended && event.shiftKey) selectRange(active, values);
        else toggle(active);
        return;
      default:
        if (recommended && mod && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          commitValues(new Set(ordered.filter((_, index) => enabled(index)).map((e) => e.value)));
          return;
        }
        if (event.key.length === 1 && !mod && !event.altKey) {
          event.preventDefault();
          typeahead(event.key);
        }
        return;
    }

    event.preventDefault();
    if (target === undefined || target < 0) return;
    moveTo(target);
    if (!multiple) {
      selectOnly(target);
    } else if (recommended && event.shiftKey) {
      if (mod && (event.key === 'Home' || event.key === 'End')) {
        anchor = active;
        selectRange(target, values);
      } else {
        if (anchor < 0) anchor = from < 0 ? target : from;
        selectRange(target, values);
      }
    }
  };

  const onOptionClick = (event: MouseEvent, index: number): void => {
    if (disabled || !enabled(index)) return;
    moveTo(index);
    listbox?.focus();
    if (!multiple) {
      selectOnly(index);
    } else if (selectionModel === 'toggle' || event.ctrlKey || event.metaKey) {
      toggle(index);
    } else if (event.shiftKey) {
      selectRange(index);
    } else {
      selectOnly(index);
    }
  };

  const onfocus = (): void => {
    if (active >= 0 || ordered.length === 0) return;
    const firstSelected = ordered.findIndex((entry, index) => enabled(index) && isSelected(entry));
    active = firstSelected >= 0 ? firstSelected : nextEnabled(0, 1);
  };

  // In option order whatever order `values` arrived in (a caller's initial
  // array is not normalised until the reader changes the selection).
  const posted = $derived(
    multiple
      ? ordered.filter((entry) => values.includes(entry.value)).map((entry) => entry.value)
      : value === undefined
        ? []
        : [value],
  );
</script>

{#snippet item(entry: ListboxOption)}
  {@const index = indexOf(entry)}
  {@const selected = isSelected(entry)}
  <!-- Focus stays on the listbox (aria-activedescendant), which handles the
       keys, so an option is neither focusable nor keyboard-activated itself. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
  <div
    id={optionId(index)}
    role="option"
    aria-selected={selected}
    aria-disabled={entry.disabled === true || disabled ? 'true' : undefined}
    class={[
      'flex cursor-default items-center gap-2 px-3 py-2',
      index === active && 'bg-base-200',
      selected && 'bg-primary/15 font-medium',
      (entry.disabled === true || disabled) && 'opacity-50',
    ]}
    onclick={(event) => {
      onOptionClick(event, index);
    }}
  >
    <span class="inline-flex size-4 shrink-0" aria-hidden="true">
      {#if selected}<Check class="size-4" />{/if}
    </span>
    <span class="min-w-0 flex-1">
      {#if option}{@render option(entry, { selected })}{:else}{entry.label}{/if}
    </span>
  </div>
{/snippet}

<div
  {...rest}
  bind:this={listbox}
  {id}
  role="listbox"
  tabindex={disabled ? -1 : 0}
  aria-labelledby={labelId}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  aria-multiselectable={multiple ? 'true' : undefined}
  aria-invalid={invalid ? 'true' : undefined}
  aria-required={required ? 'true' : undefined}
  aria-disabled={disabled ? 'true' : undefined}
  aria-activedescendant={active >= 0 ? optionId(active) : undefined}
  class={[
    'rounded-field border-base-300 bg-base-100 focus-visible:outline-primary overflow-y-auto border focus-visible:outline-2 focus-visible:outline-offset-2',
    rowsClass[rows],
    textSize[size],
    invalid && 'border-error',
    className,
  ]}
  {onkeydown}
  {onfocus}
>
  {#if ordered.length === 0}
    <div role="none" class="text-base-content/60 px-3 py-2">{emptyLabel}</div>
  {/if}
  {#each sections.ungrouped as entry (entry.value)}
    {@render item(entry)}
  {/each}
  {#each sections.groups as [heading, list], groupIndex (heading)}
    <div role="group" aria-labelledby={groupId(groupIndex)}>
      <div
        id={groupId(groupIndex)}
        role="presentation"
        class="text-base-content/60 px-3 pt-2 pb-1 text-xs font-semibold"
      >
        {heading}
      </div>
      {#each list as entry (entry.value)}
        {@render item(entry)}
      {/each}
    </div>
  {/each}
</div>
{#if name !== undefined}
  {#each posted as selected (selected)}
    <input type="hidden" {name} value={selected} />
  {/each}
{/if}
