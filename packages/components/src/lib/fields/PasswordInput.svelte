<!-- @component
A password field with a "Show password" toggle and the `autocomplete` a password manager needs to fill or generate it.
-->
<!--
  PasswordInput — a `TextInput`-styled password field inside a daisyUI
  `input` composite, with a trailing toggle that flips the input between
  `type="password"` and `type="text"`, and a `purpose` prop that sets
  `autocomplete` to `current-password` or `new-password`, which is what makes
  a password manager fill (sign-in) or offer to generate (sign-up).

  Why not a `revealable` prop on `TextInput`: `TextInput` IS a bare `<input>`,
  and a toggle needs a wrapper and a button, which would move where `class`
  and `...rest` land for every existing caller. So this follows `SearchInput`,
  the composite-input precedent: a `<div class="input">` (not a `<label>`,
  which would fold the toggle's name into the input's accessible name when
  the field sits inside `FormField`), the native input inside it, a trailing
  button. `...rest` (`id`, `name`, `minlength`, `aria-*`, `data-*`) goes on
  the inner input, the element a label, a test and a form need; `class` goes
  on the wrapper and `inputClass` on the input. `passwordrules` is passed
  through when given, never defaulted.

  ARIA contract: the toggle is an APG button with `aria-pressed` — a real
  `<button type="button">` (so it never submits the form) with a CONSTANT
  name, `showLabel`, and a pressed state ("Show password, toggle button,
  pressed"), rather than a name that swaps between "Show" and "Hide", which
  some screen readers do not re-announce. It `aria-controls` the input; its
  icon is `aria-hidden`. Activating it leaves focus on the toggle and keeps
  the input's selection range across the type flip. The input keeps native
  semantics plus `FieldControl`'s `aria-describedby`, `aria-invalid` and
  `required`.

  The field is hidden again when its form submits, so a revealed password
  does not survive into the browser's form-restore cache.
-->
<script lang="ts">
  import { Eye, EyeOff } from '@lucide/svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { inputButtonSize, inputSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'size' | 'autocomplete'> {
    /**
     * The password. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * Which password: sets `autocomplete` to `current-password` (sign-in) or `new-password` (sign-up, change password).
     * @defaultValue `'current'`
     */
    purpose?: 'current' | 'new' | undefined;
    /**
     * Whether the text is currently shown. Bindable.
     * @defaultValue `false`
     */
    revealed?: boolean | undefined;
    /**
     * Render the show/hide toggle; without it the field is a styled `type="password"`.
     * @defaultValue `true`
     */
    revealable?: boolean | undefined;
    /**
     * The toggle's accessible name; its `aria-pressed` state says whether it is on.
     * @defaultValue `'Show password'`
     */
    showLabel?: string | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** Extra classes on the inner `<input>`; `class` goes on the wrapper. */
    inputClass?: string | undefined;
    /** `FieldControl`: the input's `id`, which `FormField`'s label points at. Minted when omitted. */
    id?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — the input is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and `input-error`.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
  }

  let {
    value = $bindable(''),
    purpose = 'current',
    revealed = $bindable(false),
    revealable = true,
    showLabel = 'Show password',
    size = 'md',
    inputClass,
    id: idProp,
    describedBy = '',
    labelId: _labelId,
    invalid = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  let input = $state<HTMLInputElement | null>(null);

  /**
   * Flip `revealed`, keeping the caret / selection where it was. Chromium
   * rebuilds a text field's inner editor when its `type` changes and drops the
   * selection at the next rendering step, so the range is put back in the
   * following animation frame.
   */
  function toggle(): void {
    const start = input?.selectionStart ?? null;
    const end = input?.selectionEnd ?? null;
    revealed = !revealed;
    if (start === null || end === null) return;
    requestAnimationFrame(() => input?.setSelectionRange(start, end));
  }

  // Hide again on submit, so a revealed password is not restored with the form.
  $effect(() => {
    const form = input?.form;
    if (form === null || form === undefined) return;
    const hide = (): void => {
      revealed = false;
    };
    form.addEventListener('submit', hide);
    return () => form.removeEventListener('submit', hide);
  });
</script>

<div class={['input w-full', inputSize[size], invalid && 'input-error', revealable && 'pe-1', className]}>
  <input
    {...rest}
    bind:this={input}
    {id}
    type={revealed ? 'text' : 'password'}
    autocomplete={purpose === 'new' ? 'new-password' : 'current-password'}
    bind:value
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    class={inputClass}
  />
  {#if revealable}
    <button
      type="button"
      aria-pressed={revealed}
      aria-controls={id}
      disabled={rest.disabled === true}
      class={['btn btn-square btn-ghost', inputButtonSize[size]]}
      onclick={toggle}
    >
      {#if revealed}
        <EyeOff class="size-4" aria-hidden="true" />
      {:else}
        <Eye class="size-4" aria-hidden="true" />
      {/if}
      <span class="sr-only">{showLabel}</span>
    </button>
  {/if}
</div>
