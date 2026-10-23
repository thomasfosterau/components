<!-- @component
A daisyUI `input` over a native `<input>`, with a bindable `value` and `FieldControl` wiring.
-->
<!--
  TextInput — daisyUI `input` over a native `<input>`, with a bindable `value`
  and the `FieldControl` wiring (`describedBy` → `aria-describedby`, `invalid`
  → `aria-invalid` + `input-error`).

  ARIA contract: a native input, so the role, the keyboard and the validation
  semantics are the platform's. The component adds only the two attributes
  that tie it back to its `FormField`; everything else — `name`, `autocomplete`,
  `maxlength`, `pattern`, `data-*` — passes straight through, because a
  control that swallows those cannot be submitted, tested or hooked into.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { inputSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'size'> {
    /**
     * The text. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * The text-ish `type`s. Dates have `DateInput`, files have `FileInput`.
     * @defaultValue `'text'`
     */
    type?: 'text' | 'email' | 'url' | 'password' | 'tel' | 'number' | 'search' | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * Ids for `aria-describedby`; empty means none.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — this control is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
  }

  let {
    value = $bindable(''),
    type = 'text',
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    class: className,
    ...rest
  }: Props = $props();
</script>

<input
  {...rest}
  {type}
  bind:value
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  class={['input w-full', inputSize[size], invalid && 'input-error', className]}
/>
