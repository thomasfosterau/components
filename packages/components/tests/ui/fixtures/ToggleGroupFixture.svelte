<!-- A ToggleGroup with its value bound and echoed, inside a <form> (for the
     hidden inputs) and optionally a FormField (for labelId). -->
<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import ToggleGroup from '../../../src/lib/ui/ToggleGroup.svelte';

  interface Props {
    type?: 'single' | 'multiple' | undefined;
    required?: boolean | undefined;
    initial?: string | undefined;
    inField?: boolean | undefined;
    orientation?: 'horizontal' | 'vertical' | undefined;
    tooltip?: boolean | undefined;
    block?: boolean | undefined;
  }

  let {
    type = 'single',
    required = false,
    initial = '',
    inField = false,
    orientation,
    tooltip,
    block,
  }: Props = $props();

  const views = [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
    { value: 'map', label: 'Map', iconOnly: true },
    { value: 'table', label: 'Table', disabled: true },
  ] as const;
  const formatting = [
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
    { value: 'underline', label: 'Underline' },
  ] as const;

  // svelte-ignore state_referenced_locally
  let single = $state<string>(initial);
  let multiple = $state<readonly string[]>([]);
  let posted = $state('');
</script>

<button type="button">Before</button>
<form
  onsubmit={(event) => {
    event.preventDefault();
    posted = new FormData(event.currentTarget).getAll('choice').join(',');
  }}
>
  {#if inField}
    <FormField label="View" hint="How to show the beds.">
      {#snippet children(control)}
        <ToggleGroup {...control} type="single" items={views} bind:value={single} name="choice" />
      {/snippet}
    </FormField>
  {:else if type === 'single'}
    <ToggleGroup
      type="single"
      label="View"
      items={views}
      bind:value={single}
      {required}
      name="choice"
      {orientation}
      {tooltip}
      {block}
      data-testid="group"
      class="mt-1"
    />
  {:else}
    <ToggleGroup type="multiple" label="Formatting" items={formatting} bind:value={multiple} name="choice" />
  {/if}
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{type === 'single' || inField ? single : multiple.join(',')}</p>
<p data-testid="posted">{posted}</p>
