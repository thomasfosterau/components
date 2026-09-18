<!--
  DateInput — the native `<input type="date">` in daisyUI `input` styling.

  `value` holds the ISO calendar date (`YYYY-MM-DD`) the control speaks
  natively, which is also the shape a JSON API's date fields take, so no
  conversion sits between the two.

  Native on purpose, and the reason is worth stating: bits-ui's `DateField`
  is a segmented control with its own locale handling and its own keyboard
  contract, which is the right answer when a design needs a calendar popover
  and the wrong one for a single date on a form — the platform control is
  keyboard-complete, localises itself, and on a phone opens the system date
  picker that people already know.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { inputSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'size' | 'min' | 'max'> {
    /** ISO calendar date, `YYYY-MM-DD`; empty when unset. */
    value?: string;
    /** Earliest selectable date, ISO. */
    min?: string | undefined;
    /** Latest selectable date, ISO. */
    max?: string | undefined;
    size?: FieldSize | undefined;
    invalid?: boolean | undefined;
    describedBy?: string | undefined;
  }

  let {
    value = $bindable(''),
    min,
    max,
    size = 'md',
    invalid = false,
    describedBy = '',
    class: className,
    ...rest
  }: Props = $props();
</script>

<input
  {...rest}
  type="date"
  bind:value
  {min}
  {max}
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  class={['input w-full', inputSize[size], invalid && 'input-error', className]}
/>
