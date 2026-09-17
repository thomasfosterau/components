<!--
  Select — a native `<select>` in daisyUI `select` styling over a list of
  options, with a bindable `value`, an optional placeholder option (disabled,
  selected while `value` is empty) and the `FieldControl` wiring.

  Native, not bits-ui, and deliberately: a native select is keyboard-complete
  and typeahead-complete without a line of script, and on a phone it opens the
  platform picker. The rich alternative is `Combobox`, which exists for the
  case a select genuinely cannot serve — a list too long to scroll, or one
  that has to be fetched.

  ARIA contract: the platform's. `describedBy` and `invalid` are the only
  attributes added.
-->
<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { selectSize, toFieldOptions, type FieldOptionInput, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLSelectAttributes, 'value' | 'size'> {
    /** Full options, or bare strings when value and label are the same. */
    options: readonly FieldOptionInput[];
    value?: string;
    /** Disabled first option, shown while nothing is selected. */
    placeholder?: string | undefined;
    size?: FieldSize | undefined;
    invalid?: boolean | undefined;
    describedBy?: string | undefined;
  }

  let {
    options,
    value = $bindable(''),
    placeholder,
    size = 'md',
    invalid = false,
    describedBy = '',
    class: className,
    ...rest
  }: Props = $props();

  const entries = $derived(toFieldOptions(options));
</script>

<select
  {...rest}
  bind:value
  aria-invalid={invalid ? 'true' : undefined}
  aria-describedby={describedBy === '' ? undefined : describedBy}
  class={['select w-full', selectSize[size], invalid && 'select-error', className]}
>
  {#if placeholder !== undefined}
    <option value="" disabled>{placeholder}</option>
  {/if}
  {#each entries as option (option.value)}
    <option value={option.value} disabled={option.disabled === true}>{option.label}</option>
  {/each}
</select>
