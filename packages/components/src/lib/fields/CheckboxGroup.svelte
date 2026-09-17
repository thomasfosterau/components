<!--
  CheckboxGroup — several checkboxes answering one question, inside one
  `Fieldset`.

  ARIA contract: the `<legend>` names the group and is repeated as focus moves
  between the boxes; each box is named by its own inline label; the group's
  hint and errors are on the `<fieldset>`, so they are read once for the group
  rather than once per box.

  `values` is the list of TICKED values, bindable. It is a plain array rather
  than a `Set` because that is what a form's decoded body and a JSON payload
  both look like, and because Svelte's deep reactivity tracks it.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Checkbox from './Checkbox.svelte';
  import Fieldset from './Fieldset.svelte';
  import { toFieldOptions, type FieldOptionInput, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
    /** The question the boxes answer. */
    legend: string;
    /** Full options, or bare strings when value and label are the same. */
    options: readonly FieldOptionInput[];
    /** The ticked values. */
    values?: string[];
    /** Posted field name; every box shares it, as a multi-value field. */
    name?: string | undefined;
    hint?: string | undefined;
    errors?: readonly string[] | undefined;
    required?: boolean | undefined;
    requiredLabel?: string | undefined;
    disabled?: boolean | undefined;
    size?: FieldSize | undefined;
  }

  let {
    legend,
    options,
    values = $bindable([]),
    name,
    hint,
    errors = [],
    required = false,
    requiredLabel = '(required)',
    disabled = false,
    size = 'md',
    ...rest
  }: Props = $props();

  const entries = $derived(toFieldOptions(options));
  const invalid = $derived(errors.length > 0);

  const toggle = (value: string, ticked: boolean): void => {
    values = ticked ? [...values, value] : values.filter((entry) => entry !== value);
  };
</script>

<Fieldset {...rest} {legend} {hint} {errors} {required} {requiredLabel}>
  {#each entries as option (option.value)}
    <Checkbox
      label={option.label}
      {name}
      {size}
      {invalid}
      value={option.value}
      disabled={disabled || option.disabled === true}
      checked={values.includes(option.value)}
      onchange={(event) => toggle(option.value, event.currentTarget.checked)}
    />
  {/each}
</Fieldset>
