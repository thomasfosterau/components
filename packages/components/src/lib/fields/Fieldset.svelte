<!--
  Fieldset — the same frame as `FormField`, for a GROUP of controls rather
  than one.

  A group of related checkboxes or radios is a `<fieldset>` with a `<legend>`,
  not a label pointing at one input: there is no single control for a `for`
  attribute to name, and the legend is what assistive technology repeats as it
  moves between the members. So the hint and the errors hang off the
  `<fieldset>` itself through `aria-describedby`. There is no `aria-invalid`:
  the implicit `group` role does not support it, so the invalid state is a
  `data-invalid` hook for styling and the error region is what announces it.

  `CheckboxGroup` is built on this. `RadioGroup` is not — bits-ui's radio
  group renders its own `role="radiogroup"` element, and a role inside a
  `<fieldset>` would be named by nothing, so it names itself from a heading it
  renders instead. That is the one place the two frames diverge.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import FieldErrors from './FieldErrors.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
    /** The group's `<legend>`; names every control inside it. */
    legend: string;
    hint?: string | undefined;
    errors?: readonly string[] | undefined;
    required?: boolean | undefined;
    /** Read out after the legend when `required`. */
    requiredLabel?: string | undefined;
    children: Snippet<[]>;
  }

  let {
    legend,
    hint,
    errors = [],
    required = false,
    requiredLabel = '(required)',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const invalid = $derived(errors.length > 0);

  const describedBy = $derived(
    [hint === undefined ? '' : hintId, invalid ? errorId : '']
      .filter((part) => part !== '')
      .join(' '),
  );
</script>

<fieldset
  {...rest}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  data-invalid={invalid ? '' : undefined}
  class={['fieldset', className]}
>
  <legend class="fieldset-legend">
    {legend}
    {#if required}
      <span class="text-error" aria-hidden="true">*</span>
      <span class="sr-only">{requiredLabel}</span>
    {/if}
  </legend>
  {@render children()}
  {#if hint !== undefined}
    <p class="fieldset-label" id={hintId}>{hint}</p>
  {/if}
  <FieldErrors {errors} id={errorId} />
</fieldset>
