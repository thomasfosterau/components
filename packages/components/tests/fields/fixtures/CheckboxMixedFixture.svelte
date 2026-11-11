<!-- A mixed Checkbox with both states bound, and a select-all CheckboxGroup
     in a form, so a test can read the bindings and what the form posts. -->
<script lang="ts">
  import Checkbox from '../../../src/lib/fields/Checkbox.svelte';
  import CheckboxGroup from '../../../src/lib/fields/CheckboxGroup.svelte';

  interface Props {
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { onSubmitted }: Props = $props();

  let checked = $state(false);
  let indeterminate = $state(true);
  let values = $state<string[]>([]);
</script>

<Checkbox label="All beds" bind:checked bind:indeterminate />
<p data-testid="single">{checked ? 'checked' : 'unchecked'} {indeterminate ? 'mixed' : 'settled'}</p>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <CheckboxGroup
    legend="Vegetables"
    name="veg"
    selectAll
    selectAllLabel="All vegetables"
    options={['Kale', 'Leek', { value: 'Okra', label: 'Okra', disabled: true }]}
    bind:values
  />
  <button type="submit">Save</button>
</form>
<p data-testid="values">{values.join('|')}</p>
