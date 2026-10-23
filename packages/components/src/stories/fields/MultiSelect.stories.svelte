<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import MultiSelect from '../../lib/fields/MultiSelect.svelte';

  const { Story } = defineMeta({
    title: 'Fields/MultiSelect',
    component: MultiSelect,
    parameters: {
      docs: {
        description: {
          component:
            'Several choices from a known list, summarised in the trigger, on bits-ui’s `Select` (`type="multiple"`). Use `CheckboxGroup` for about seven options or fewer, `Select` for one native choice.',
        },
      },
    },
  });

  const conditions = ['Full sun', 'Part shade', 'Full shade', 'Well-drained', 'Moist', 'Dry'];
  const beds = Array.from({ length: 30 }, (_, index) => `Bed ${index + 1}`);
  const plans = [
    { value: 'seed', label: 'Seed' },
    { value: 'seedling', label: 'Seedling' },
    { value: 'cutting', label: 'Cutting' },
  ];
  const notes: Record<string, string> = {
    seed: 'Sown direct or in trays',
    seedling: 'Bought or raised in pots',
    cutting: 'Taken from a parent plant',
  };
</script>

<Story name="Basic">
  <div class="max-w-sm">
    <FormField label="Growing conditions">
      {#snippet children(control)}
        <MultiSelect {...control} options={conditions} values={['Full sun', 'Well-drained']} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Many options">
  <div class="max-w-sm">
    <FormField label="Show beds" hint="Pick any number.">
      {#snippet children(control)}
        <MultiSelect {...control} options={beds} values={['Bed 1', 'Bed 4', 'Bed 7']} formatOverflow={(n) => `+${n} more`} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Custom option">
  <div class="max-w-sm">
    <FormField label="Propagation">
      {#snippet children(control)}
        <MultiSelect {...control} options={plans}>
          {#snippet option(entry)}
            <span class="flex flex-col">
              <span>{entry.label}</span>
              <span class="text-base-content/60 text-xs">{notes[entry.value]}</span>
            </span>
          {/snippet}
        </MultiSelect>
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Invalid">
  <div class="max-w-sm">
    <FormField label="Growing conditions" errors={['Pick at least one.']} required>
      {#snippet children(control)}
        <MultiSelect {...control} options={conditions} />
      {/snippet}
    </FormField>
  </div>
</Story>
