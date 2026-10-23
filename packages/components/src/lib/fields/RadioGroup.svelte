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
-->
<script lang="ts">
  import { RadioGroup } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import FieldErrors from './FieldErrors.svelte';
  import { toFieldOptions, type FieldOptionInput } from './field-types.ts';

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
</script>

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
    class={['flex gap-3', orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col']}
  >
    {#each entries as option (option.value)}
      <RadioGroup.Item
        value={option.value}
        disabled={option.disabled === true}
        class="rounded-field focus-visible:outline-primary flex cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {#snippet children({ checked })}
          <span
            aria-hidden="true"
            class={[
              'grid size-4 shrink-0 place-items-center rounded-full border-2',
              checked ? 'border-primary' : 'border-base-content/40',
            ]}
          >
            {#if checked}<span class="bg-primary size-2 rounded-full"></span>{/if}
          </span>
          <span>{option.label}</span>
        {/snippet}
      </RadioGroup.Item>
    {/each}
  </RadioGroup.Root>
  {#if hint !== undefined}
    <p class="fieldset-label" id={hintId}>{hint}</p>
  {/if}
  <FieldErrors {errors} id={errorId} />
</div>
