<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { parseDate } from '@internationalized/date';
  import DateField from '../../lib/fields/DateField.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import TimeField from '../../lib/fields/TimeField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/DateField',
    component: DateField,
    parameters: {
      docs: {
        description: {
          component:
            'Segmented date and time entry on bits-ui, from `@thomasfosterau/components/dates`. Each segment is a spinbutton: type digits, step with ↑/↓, move with ←/→. The locale sets the order. For a single date on a form the native `DateInput` remains the default.',
        },
      },
    },
  });
</script>

<Story name="In a FormField">
  <FormField label="Sown on" hint="As on the seed packet.">
    {#snippet children(control)}<DateField {...control} name="sown" locales="en-AU" />{/snippet}
  </FormField>
</Story>

<Story name="US order, with a value">
  <FormField label="Sown on">
    {#snippet children(control)}
      <DateField {...control} value={parseDate('2026-10-14')} locales="en-US" />
    {/snippet}
  </FormField>
</Story>

<Story name="In error">
  <FormField label="Sown on" errors={['Pick a day in spring.']}>
    {#snippet children(control)}<DateField {...control} locales="en-AU" />{/snippet}
  </FormField>
</Story>

<Story name="TimeField, 24-hour">
  <FormField label="Water at">
    {#snippet children(control)}<TimeField {...control} hourCycle={24} locales="en-AU" />{/snippet}
  </FormField>
</Story>

<Story name="TimeField, 12-hour">
  <FormField label="Water at">
    {#snippet children(control)}<TimeField {...control} hourCycle={12} locales="en-AU" />{/snippet}
  </FormField>
</Story>
