<!-- @component
A fixed-length code — a sign-in code, a TOTP, an invite code — typed one character per visible cell into one real input, on bits-ui's `PinInput`.
-->
<!--
  PinInput — one real `<input>` (bits-ui `PinInput`) drawn as a row of
  cells. Being one input is the whole point: paste, SMS autofill
  (`autocomplete="one-time-code"`), password managers and form posting all
  treat it as one field, and a screen reader hears one text field rather
  than six unlabelled one-character edits — the failure mode of the
  hand-rolled six-`<input maxlength=1>` pattern.

  ARIA contract: there is no APG pattern for segmented code entry; the
  contract is "a single text input". The input carries the `FieldControl` id
  (bits-ui `inputId`), so `FormField`'s `<label for>` names it, plus
  `aria-describedby`, `aria-invalid`, `required`, `inputmode`,
  `autocomplete` and `maxlength`. The cells are `aria-hidden` presentation
  and nothing in them is focusable. The keyboard is the platform's: typing
  advances, Backspace deletes, arrows move the caret, paste fills the code;
  bits-ui draws the fake caret in the active cell.

  `charset` maps to `inputmode` and to bits-ui's own patterns
  (`REGEXP_ONLY_DIGITS` / `REGEXP_ONLY_DIGITS_AND_CHARS`), which both reject
  a keystroke that does not match and become the input's `pattern`.
  `pasteTransformer` defaults to stripping whitespace and hyphens, so a code
  pasted from an email as "123 456" or "123-456" lands as "123456".

  Styling decision (the issue asked for one to be recorded): bits-ui's
  explicit `PinInput.Cell` elements, styled with `input`-like utilities and
  the literal `pinCellSize` table, rather than daisyUI `otp` on the hidden
  input. bits-ui renders the real input transparent over the cells, so
  `otp`'s CSS-drawn cells would sit on an invisible element, and bits-ui's
  fake caret and its password-manager badge offset
  (`pushPasswordManagerStrategy`) are positioned against the cells.

  `masked` renders `•` in each filled cell in place of the character (bits-ui
  2.20 has no masking prop). The input itself is unchanged — it keeps
  `autocomplete` so a password manager can still fill it, and it is
  transparent, so the characters are never drawn.
-->
<script lang="ts">
  import { PinInput, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'bits-ui';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { pinCellSize, type FieldSize } from './field-types.ts';

  interface Props
    extends Omit<
      HTMLInputAttributes,
      'value' | 'size' | 'type' | 'maxlength' | 'pattern' | 'children' | 'inputmode'
    > {
    /**
     * The code typed so far. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * Number of cells, and the input's `maxlength`.
     * @defaultValue `6`
     */
    length?: number | undefined;
    /**
     * Which characters are accepted; sets `inputmode` and the input's pattern.
     * @defaultValue `'numeric'`
     */
    charset?: 'numeric' | 'alphanumeric' | undefined;
    /**
     * Show `•` in the cells instead of the characters (a PIN rather than a code).
     * @defaultValue `false`
     */
    masked?: boolean | undefined;
    /** Called once every cell is filled, with the full code — typically to submit. */
    onComplete?: ((code: string) => void) | undefined;
    /** Normalise pasted text before it is applied. Defaults to stripping whitespace and hyphens. */
    pasteTransformer?: ((text: string) => string) | undefined;
    /**
     * The input's `autocomplete`.
     * @defaultValue `'one-time-code'`
     */
    autocomplete?: HTMLInputAttributes['autocomplete'];
    /**
     * Size step of the cells.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /**
     * Disables the input.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /** `FieldControl`: the real input's `id`, which `FormField`'s label points at. */
    id?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — sets `aria-invalid` and the error border.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
  }

  let {
    value = $bindable(''),
    length = 6,
    charset = 'numeric',
    masked = false,
    onComplete,
    pasteTransformer = (text: string) => text.replace(/[\s-]/g, ''),
    autocomplete = 'one-time-code',
    size = 'md',
    disabled = false,
    id,
    describedBy = '',
    invalid = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? uid);
</script>

<PinInput.Root
  {...rest}
  bind:value
  {inputId}
  maxlength={length}
  pattern={charset === 'numeric' ? REGEXP_ONLY_DIGITS : REGEXP_ONLY_DIGITS_AND_CHARS}
  inputmode={charset === 'numeric' ? 'numeric' : 'text'}
  {autocomplete}
  {disabled}
  {pasteTransformer}
  onComplete={(code: string) => onComplete?.(code)}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  aria-invalid={invalid ? 'true' : undefined}
  class={['flex items-center gap-2 has-disabled:opacity-50', className]}
>
  {#snippet children({ cells })}
    {#each cells as cell, index (index)}
      <PinInput.Cell
        {cell}
        aria-hidden="true"
        class={[
          'relative flex items-center justify-center rounded-field border bg-base-100 font-mono',
          'data-active:outline-2 data-active:outline-offset-2',
          invalid ? 'border-error data-active:outline-error' : 'border-base-content/20 data-active:outline-primary',
          pinCellSize[size],
        ]}
      >
        {#if cell.char !== null && cell.char !== undefined}
          {masked ? '•' : cell.char}
        {/if}
        {#if cell.hasFakeCaret}
          <span class="h-1/2 w-px animate-pulse bg-base-content motion-reduce:animate-none"></span>
        {/if}
      </PinInput.Cell>
    {/each}
  {/snippet}
</PinInput.Root>
