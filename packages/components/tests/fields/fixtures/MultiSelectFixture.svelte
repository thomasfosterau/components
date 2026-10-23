<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import MultiSelect from '../../../src/lib/fields/MultiSelect.svelte';
  import type { FieldOptionInput } from '../../../src/lib/fields/field-types.ts';

  interface Props {
    values?: string[] | undefined;
    errors?: readonly string[] | undefined;
    maxShown?: number | undefined;
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { values = $bindable([]), errors, maxShown, onSubmitted }: Props = $props();

  const options: readonly FieldOptionInput[] = [
    'Full sun',
    'Part shade',
    'Well-drained',
    'Moist',
    { value: 'Bog', label: 'Bog', disabled: true },
  ];
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Growing conditions" hint="Pick all that apply." {errors}>
    {#snippet children(control)}
      <MultiSelect {...control} {options} {maxShown} name="conditions" portal={false} bind:values />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{values.join('|')}</p>
