<!-- @component
One choice from a short, known list, on bits-ui’s `RadioGroup`.
-->
<!--
  RadioGroup — one choice from a short, known list, on bits-ui's `RadioGroup`.

  bits-ui owns what is genuinely hard here: the roving tabindex (the group is
  ONE tab stop, and the arrow keys move within it), wrap-around, and the
  `aria-checked` bookkeeping. Hand-rolled radio groups get the tab stop wrong
  almost every time.

  ARIA contract: bits-ui renders `role="radiogroup"` around `role="radio"`
  buttons, and this adds `aria-orientation` beside the `data-orientation`
  bits-ui sets, so the arrow keys a reader is told to use match the ones that
  work. A `role` element cannot be named by a `<legend>` — the legend names
  the `<fieldset>`, which is a different node — so the group renders its
  question as a heading-ish `<span>` and points `aria-labelledby` at it. That
  is why this is the one field group NOT built on `Fieldset`, and the hint and
  errors hang off the radiogroup element itself through `aria-describedby`.
  It is a whole frame (question, hint, errors), not a control a `FormField`
  wraps, so it keeps its own `legend` rather than taking a `FieldControl`'s
  `labelId`: inside a `FormField` it would render two labels.

  The marker is drawn rather than delegated to daisyUI's `.radio`, because
  that class styles an `<input type="radio">` through `:checked` and bits-ui's
  radio is a `<button>`. It is two spans of semantic tokens; `checked` comes
  from bits-ui's own snippet prop, so the visual and the accessibility tree
  cannot disagree.

  `variant="cards"` lays the options out as a grid of tiles: each tile is
  still one bits-ui radio, named by its title (`aria-labelledby`) and
  described by its description, and its checked state is a border, a ring
  and a check badge, never colour alone. A tile is a button, so nothing
  focusable may go inside one; in development the group warns if it does.
-->
<script lang="ts">
  import { RadioGroup } from 'bits-ui';
  import { DEV } from 'esm-env';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ChoiceCardContent from './ChoiceCardContent.svelte';
  import FieldErrors from './FieldErrors.svelte';
  import {
    choiceCardClass,
    choiceColumns,
    toFieldOptions,
    type ChoiceCardState,
    type ChoiceColumns,
    type ChoiceIndicator,
    type ChoiceVariant,
    type FieldOption,
    type FieldOptionInput,
  } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The question the options answer; names the group. */
    legend: string;
    /** Full options, or bare strings when value and label are the same. */
    options: readonly FieldOptionInput[];
    /**
     * The chosen value; empty string when nothing is chosen.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * Lay the options out in a column or a row.
     * @defaultValue `'vertical'`
     */
    orientation?: 'vertical' | 'horizontal' | undefined;
    /** Posted field name — bits-ui renders the hidden input when it is set. */
    name?: string | undefined;
    /** Guidance rendered under the legend. */
    hint?: string | undefined;
    /**
     * Validation messages; any at all marks the group invalid.
     * @defaultValue `[]`
     */
    errors?: readonly string[] | undefined;
    /** Marks the group required and reads `requiredLabel` after the legend. */
    required?: boolean | undefined;
    /**
     * Read out after the legend when `required`.
     * @defaultValue `'(required)'`
     */
    requiredLabel?: string | undefined;
    /** Disables every option. */
    disabled?: boolean | undefined;
    /**
     * Rows of markers and labels, or a grid of selectable cards.
     * @defaultValue `'list'`
     */
    variant?: ChoiceVariant | undefined;
    /**
     * The `cards` grid's widest column count, or `'auto'` to fill by width.
     * @defaultValue `3`
     */
    columns?: ChoiceColumns | undefined;
    /**
     * Where a card's radio marker sits.
     * @defaultValue `'end'`
     */
    indicator?: ChoiceIndicator | undefined;
    /** A card's body in place of its title and description; nothing in it may be focusable. */
    card?: Snippet<[FieldOption, ChoiceCardState]> | undefined;
  }

  let {
    legend,
    options,
    value = $bindable(''),
    orientation = 'vertical',
    name,
    hint,
    errors = [],
    required = false,
    requiredLabel = '(required)',
    disabled = false,
    variant = 'list',
    columns = 3,
    indicator = 'end',
    card,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const legendId = `${uid}-legend`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;

  const entries = $derived(toFieldOptions(options));
  const invalid = $derived(errors.length > 0);
  const describedBy = $derived(
    [hint === undefined ? '' : hintId, invalid ? errorId : '']
      .filter((part) => part !== '')
      .join(' '),
  );
  const cards = $derived(variant === 'cards');
  const layout = $derived.by(() => {
    if (cards) return ['grid gap-3', choiceColumns[columns]];
    return ['flex gap-3', orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'];
  });

  const FOCUSABLE =
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  let root: HTMLElement | null = $state(null);

  $effect(() => {
    if (!DEV || !cards || root?.querySelector(`[data-choice-card] :is(${FOCUSABLE})`) == null) return;
    // A tile is a radio button, and interactive elements cannot nest: the
    // inner control would be unreachable by keyboard and confuse a screen reader.
    console.warn('[RadioGroup] A card holds a focusable element. Nothing inside a choice card may be interactive.');
  });
</script>

{#snippet marker(checked: boolean)}
  <span
    aria-hidden="true"
    class={[
      'grid size-4 shrink-0 place-items-center rounded-full border-2',
      checked ? 'border-primary' : 'border-base-content/40',
    ]}
  >
    {#if checked}<span class="bg-primary size-2 rounded-full"></span>{/if}
  </span>
{/snippet}

{#snippet cardItem(option: FieldOption, index: number)}
  {@const titleId = `${uid}-card-${index}`}
  {@const descriptionId = `${uid}-card-${index}-description`}
  <RadioGroup.Item
    value={option.value}
    disabled={option.disabled === true}
    data-choice-card=""
    aria-labelledby={titleId}
    aria-describedby={option.description === undefined ? undefined : descriptionId}
    class={[
      choiceCardClass,
      'data-[state=checked]:border-primary data-[state=checked]:ring-primary focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:ring-1',
    ]}
  >
    {#snippet children({ checked })}
      {#snippet radio()}{@render marker(checked)}{/snippet}
      <ChoiceCardContent
        {option}
        state={{ checked, disabled: disabled || option.disabled === true }}
        {titleId}
        {descriptionId}
        {card}
        indicator={indicator === 'hidden' ? undefined : radio}
        indicatorAtEnd={indicator === 'end'}
      />
    {/snippet}
  </RadioGroup.Item>
{/snippet}

<div {...rest} class={['fieldset', className]}>
  <span id={legendId} class="fieldset-legend">
    {legend}
    {#if required}
      <span class="text-error" aria-hidden="true">*</span>
      <span class="sr-only">{requiredLabel}</span>
    {/if}
  </span>
  <RadioGroup.Root
    bind:value
    {orientation}
    {...name === undefined ? {} : { name }}
    {required}
    {disabled}
    aria-labelledby={legendId}
    aria-orientation={orientation}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    aria-invalid={invalid ? 'true' : undefined}
    class={layout}
    bind:ref={root}
  >
    {#each entries as option, index (option.value)}
      {#if cards}
        {@render cardItem(option, index)}
      {:else}
        <RadioGroup.Item
          value={option.value}
          disabled={option.disabled === true}
          class="rounded-field focus-visible:outline-primary flex cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#snippet children({ checked })}
            {@render marker(checked)}
            <span>{option.label}</span>
          {/snippet}
        </RadioGroup.Item>
      {/if}
    {/each}
  </RadioGroup.Root>
  {#if hint !== undefined}
    <p class="fieldset-label" id={hintId}>{hint}</p>
  {/if}
  <FieldErrors {errors} id={errorId} />
</div>
