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
    value?: string;
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
  }

  let {
    value = $bindable(''),
    size = 'md',
    invalid = false,
    describedBy = '',
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
