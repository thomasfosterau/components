<!--
  FormField — the label + hint + errors frame around one control.

  The control is a snippet that receives a `FieldControl` (`id`,
  `describedBy`, `invalid`, `required`) to spread onto the primitive, so the
  label's `for`, the control's `aria-describedby` and `aria-invalid`, and the
  error region's `role="alert"` all stay wired together from a single `id`.
  Neither side has to know the other's markup, which is what lets a caller
  drop any of the field primitives — or their own `<input>` — into the slot.

  ARIA contract: `<label for>` names the control (so clicking the text focuses
  it); `describedBy` lists the hint's id then the error region's id, in that
  reading order, and is empty when there is neither; `invalid` is true exactly
  when there is at least one error. The required marker is a `*` that is
  `aria-hidden` beside a visually-hidden `requiredLabel`, both inside the
  `<label>`, so the accessible name reads "Scientific name (required)" rather
  than "Scientific name star".

  `errors` is a LIST. A field that fails several rules says so; collapsing
  them to the first message is a decision the call site should make, not one
  this frame makes for it.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import FieldErrors from './FieldErrors.svelte';
  import type { FieldControl } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The control's `id`. Minted when omitted. */
    id?: string | undefined;
    /** Visible label; becomes the control's accessible name. */
    label: string;
    /** Guidance rendered under the control. */
    hint?: string | undefined;
    /** Validation messages; any at all marks the control invalid. */
    errors?: readonly string[] | undefined;
    required?: boolean | undefined;
    /** Read out after the label when `required`. */
    requiredLabel?: string | undefined;
    children: Snippet<[FieldControl]>;
  }

  let {
    id: idProp,
    label,
    hint,
    errors = [],
    required = false,
    requiredLabel = '(required)',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const hintId = $derived(`${id}-hint`);
  const errorId = $derived(`${id}-error`);
  const invalid = $derived(errors.length > 0);

  const control = $derived<FieldControl>({
    id,
    describedBy: [hint === undefined ? '' : hintId, invalid ? errorId : '']
      .filter((part) => part !== '')
      .join(' '),
    invalid,
    required,
  });
</script>

<div {...rest} class={['fieldset', className]}>
  <label class="label" for={id}>
    <span>{label}</span>
    {#if required}
      <span class="text-error" aria-hidden="true">*</span>
      <span class="sr-only">{requiredLabel}</span>
    {/if}
  </label>
  {@render children(control)}
  {#if hint !== undefined}
    <p class="fieldset-label" id={hintId}>{hint}</p>
  {/if}
  <FieldErrors {errors} id={errorId} />
</div>
