<!-- @component
The label, hint and errors frame around one control, handing it the `FieldControl` wiring.
-->
<!--
  FormField — the label + hint + errors frame around one control.

  The control is a snippet that receives a `FieldControl` (`id`, `labelId`,
  `describedBy`, `invalid`, `required`) to spread onto the primitive, so the
  label's `for`, the control's `aria-describedby` and `aria-invalid`, and the
  error region's `role="alert"` all stay wired together from a single `id`.
  Neither side has to know the other's markup, which is what lets a caller
  drop any of the field primitives — or their own `<input>` — into the slot.

  ARIA contract: `<label for>` names the control (so clicking the text focuses
  it). `<label for>` only reaches a labelable element (`input`, `select`,
  `textarea`, `button`, `meter`, `output`, `progress`), so the label also
  carries an id — `labelId` — for a role-based control (a slider thumb, a
  `group` / `radiogroup` root) to point `aria-labelledby` at, and a click on
  the label is forwarded to such a control: it focuses the control itself if
  it is focusable, else its first focusable descendant (a roving group's
  current tab stop). `describedBy` lists the hint's id then the error region's id, in that
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
    /**
     * Validation messages; any at all marks the control invalid.
     * @defaultValue `[]`
     */
    errors?: readonly string[] | undefined;
    /** Marks the control required and reads `requiredLabel` after the label. */
    required?: boolean | undefined;
    /**
     * Read out after the label when `required`.
     * @defaultValue `'(required)'`
     */
    requiredLabel?: string | undefined;
    /** The control; receives the `FieldControl` props to spread. */
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
  const labelId = $derived(`${id}-label`);
  const hintId = $derived(`${id}-hint`);
  const errorId = $derived(`${id}-error`);
  const invalid = $derived(errors.length > 0);

  const control = $derived<FieldControl>({
    id,
    labelId,
    describedBy: [hint === undefined ? '' : hintId, invalid ? errorId : '']
      .filter((part) => part !== '')
      .join(' '),
    invalid,
    required,
  });

  // The elements a `<label for>` can name; the platform handles those.
  const LABELABLE = 'button, input, meter, output, progress, select, textarea';

  // `<label for>` does nothing for a role-based control, so forward the click:
  // focus the control if it is focusable, else its first focusable descendant.
  const forwardClick = (): void => {
    const control = document.getElementById(id);
    if (control === null || control.matches(LABELABLE)) return;
    const focusable = (element: HTMLElement): boolean =>
      element.tabIndex >= 0 && !element.hasAttribute('disabled');
    const target = focusable(control)
      ? control
      : Array.from(control.querySelectorAll<HTMLElement>('*')).find(focusable);
    target?.focus();
  };
</script>

<div {...rest} class={['fieldset', className]}>
  <!-- The click handler restores what `<label for>` does natively — a pointer
       shortcut to the control — for a control `for` cannot reach. Keyboard
       users reach the control itself with Tab, as with any label, so there is
       no key handler to add and the label stays non-interactive. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <label class="label" for={id} id={labelId} onclick={forwardClick}>
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
