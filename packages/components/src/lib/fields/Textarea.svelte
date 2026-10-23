<!-- @component
A daisyUI `textarea` with a bindable `value` and `FieldControl` wiring. `rows` defaults to `4`.
-->
<!--
  Textarea — daisyUI `textarea` with a bindable `value` and the same
  `FieldControl` wiring as `TextInput`.

  ARIA contract: a native `<textarea>`; the component adds `aria-describedby`
  and `aria-invalid` and nothing else.
-->
<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { textareaSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
    /**
     * The text. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
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
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    rows = 4,
    class: className,
    ...rest
  }: Props = $props();
</script>

<textarea
  {...rest}
  {rows}
  bind:value
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  class={['textarea w-full', textareaSize[size], invalid && 'textarea-error', className]}
></textarea>
