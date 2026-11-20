<!-- A TransferList inside a FormField and a form, with the value bound, so a
     test can read the order and what the form posts. -->
<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import TransferList from '../../../src/lib/fields/TransferList.svelte';

  interface Props {
    value?: string[] | undefined;
    orderable?: boolean | undefined;
    searchable?: boolean | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { value = $bindable([]), orderable, searchable, onSubmitted }: Props = $props();

  const options = [
    'Name',
    'Email',
    { value: 'Phone', label: 'Phone', disabled: true },
    'Address',
    'Notes',
  ];
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Columns" hint="Choose and order the export's columns.">
    {#snippet children(control)}
      <TransferList {...control} {options} {orderable} {searchable} name="columns" bind:value />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{value.join('|')}</p>
