<!-- @component
A native `<select>` in daisyUI styling over a list of options, with an optional placeholder and `FieldControl` wiring.
-->
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
    /**
     * The selected option’s value; `''` selects the placeholder. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /** Disabled first option, shown while nothing is selected. */
    placeholder?: string | undefined;
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
    options,
    value = $bindable(''),
    placeholder,
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
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
