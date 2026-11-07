<!-- A Listbox inside a FormField and a form, with both selections bound, so
     a test can read the value, the values and what the form posts. -->
<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import Listbox from '../../../src/lib/fields/Listbox.svelte';

  interface Props {
    multiple?: boolean | undefined;
    selectionModel?: 'recommended' | 'toggle' | undefined;
    grouped?: boolean | undefined;
    value?: string | undefined;
    values?: string[] | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let {
    multiple = false,
    selectionModel,
    grouped = false,
    value = $bindable(undefined),
    values = $bindable([]),
    onSubmitted,
  }: Props = $props();

  const plain = [
    'Raised bed',
    'Container',
    { value: 'Greenhouse', label: 'Greenhouse', disabled: true },
    'Rockery',
    'Pond margin',
  ];
  const groupedOptions = [
    { value: 'tomato', label: 'Tomato', group: 'Fruit' },
    { value: 'chilli', label: 'Chilli', group: 'Fruit' },
    { value: 'kale', label: 'Kale', group: 'Leaves' },
  ];
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Template" hint="Where it grows.">
    {#snippet children(control)}
      <Listbox
        {...control}
        options={grouped ? groupedOptions : plain}
        {multiple}
        {selectionModel}
        name="template"
        bind:value
        bind:values
      />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{multiple ? values.join('|') : (value ?? '')}</p>
