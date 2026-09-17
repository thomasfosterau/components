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
    value?: string;
    size?: FieldSize | undefined;
    invalid?: boolean | undefined;
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
