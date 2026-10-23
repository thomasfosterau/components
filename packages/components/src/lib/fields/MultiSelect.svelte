<!-- @component
Several choices from a known list in a compact trigger that summarises them, on bits-ui's `Select` (`type="multiple"`).
-->
<!--
  MultiSelect — any number of options from a medium-sized known list: the
  trigger summarises the selection ("Full sun, Well-drained, +1"), a listbox
  popover holds the options with checkmarks. Built on bits-ui's `Select`
  with `type="multiple"`, bound to a `string[]`.

  When to use which: `CheckboxGroup` puts every option on screen (right for
  about seven or fewer); `Select` is the native single-choice `<select>`;
  `MultiSelect` is for a longer list where several may be chosen. It takes
  the same `options` shape as `Select`, so the two swap at the call site. It
  is a separate component rather than a mode on `Select` because `Select`'s
  point is to be the native control, with no script and the platform picker.

  ARIA contract (APG select-only combobox / listbox): bits-ui gives the
  trigger `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded` and
  `aria-controls`; the content `role="listbox"` with `aria-multiselectable`;
  each option `role="option"` with `aria-selected` (and `aria-disabled`,
  which bits-ui 2.20 leaves out, added here); typeahead (fed from
  `options` through bits-ui's `items`), Home / End, and Escape / Tab closing
  with focus back on the trigger. Selecting an option keeps the listbox open.
  This file adds the trigger's name (the `FieldControl` id goes on the
  trigger, so `FormField`'s `<label for>` names it), `aria-describedby`,
  `aria-invalid`, `aria-required`, the summary text and the `aria-hidden`
  check icon.

  The summary is plain text, not removable badges: focusable children inside
  a button-like trigger are an accessibility trap.

  `values` is always kept in `options` order, whatever order the reader
  clicked in, so the summary is stable. `name` posts one hidden input per
  value, in option order (and nothing at all while none is selected).
-->
<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { Select } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    selectSize,
    toFieldOptions,
    type FieldOption,
    type FieldOptionInput,
    type FieldSize,
  } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
    /** The options; bare strings are both value and label. */
    options: readonly FieldOptionInput[];
    /**
     * The selected values, in option order. Bindable.
     * @defaultValue `[]`
     */
    values?: string[] | undefined;
    /**
     * Trigger text while nothing is selected.
     * @defaultValue `'Select…'`
     */
    placeholder?: string | undefined;
    /** Posts each selected value under this name, one hidden input per value. */
    name?: string | undefined;
    /**
     * Show at most this many labels in the trigger, then the overflow count.
     * @defaultValue `2`
     */
    maxShown?: number | undefined;
    /**
     * Formats the overflow count, e.g. `(n) => \`+${n} more\``.
     * @defaultValue `(n) => \`+${n}\``
     */
    formatOverflow?: ((hidden: number) => string) | undefined;
    /** Renders one option's body (an icon, a description); defaults to its label. */
    option?: Snippet<[FieldOption, { selected: boolean }]> | undefined;
    /**
     * Render the listbox into `<body>`.
     * @defaultValue `true`
     */
    portal?: boolean | undefined;
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
    /** `FieldControl`: the trigger's `id`, which `FormField`'s label points at. Minted when omitted. */
    id?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — the trigger is a
     * `<button>`, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and `select-error`.
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
    options,
    values = $bindable([]),
    placeholder = 'Select…',
    name,
    maxShown = 2,
    formatOverflow = (hidden: number) => `+${hidden}`,
    option,
    portal = true,
    disabled = false,
    size = 'md',
    id,
    labelId: _labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const triggerId = $derived(id ?? uid);
  const entries = $derived(toFieldOptions(options));
  const items = $derived(entries.map((entry) => ({ ...entry, disabled: entry.disabled === true })));
  const selectedEntries = $derived(entries.filter((entry) => values.includes(entry.value)));
  const selectedLabels = $derived(selectedEntries.map((entry) => entry.label));
  const summary = $derived(
    selectedLabels.length <= maxShown
      ? selectedLabels.join(', ')
      : [
          ...selectedLabels.slice(0, maxShown),
          formatOverflow(selectedLabels.length - maxShown),
        ].join(', '),
  );

  const triggerText = $derived(selectedLabels.length === 0 ? placeholder : summary);
  const ariaDescribedBy = $derived(describedBy === '' ? undefined : describedBy);

  /** Keep `values` in option order, whatever order they were clicked in. */
  function setValues(next: string[]): void {
    values = entries.map((entry) => entry.value).filter((value) => next.includes(value));
  }
</script>

{#snippet optionBody(entry: FieldOption, selected: boolean)}
  <Check class={['size-4 shrink-0', !selected && 'invisible']} aria-hidden="true" />
  {#if option}
    {@render option(entry, { selected })}
  {:else}
    <span>{entry.label}</span>
  {/if}
{/snippet}

<div {...rest} class={['w-full', className]}>
  <Select.Root
    type="multiple"
    bind:value={() => values, setValues}
    {items}
    {disabled}
    {required}
  >
    <Select.Trigger
      id={triggerId}
      aria-describedby={ariaDescribedBy}
      aria-invalid={invalid ? 'true' : undefined}
      aria-required={required ? 'true' : undefined}
      class={['select w-full text-start', selectSize[size], invalid && 'select-error']}
    >
      <span class={['truncate', selectedLabels.length === 0 && 'text-base-content/60']}>
        {triggerText}
      </span>
    </Select.Trigger>
    <Select.Portal disabled={!portal}>
      <Select.Content
        sideOffset={4}
        class="menu bg-base-100 rounded-box border-base-300 z-50 max-h-72 w-(--bits-select-anchor-width) min-w-48 overflow-auto border p-2 shadow-lg"
      >
        <Select.Viewport>
          {#each entries as entry (entry.value)}
            <Select.Item
              value={entry.value}
              label={entry.label}
              disabled={entry.disabled === true}
              aria-disabled={entry.disabled === true ? 'true' : undefined}
              class="rounded-field data-highlighted:bg-base-200 data-disabled:opacity-50 flex cursor-pointer items-center gap-2 px-3 py-2"
            >
              {#snippet children({ selected })}{@render optionBody(entry, selected)}{/snippet}
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
  {#if name !== undefined}
    {#each selectedEntries as entry (entry.value)}
      <input type="hidden" {name} value={entry.value} {disabled} />
    {/each}
  {/if}
</div>
