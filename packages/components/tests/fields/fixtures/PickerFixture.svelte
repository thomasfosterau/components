<!-- A DatePicker or DateRangePicker inside a FormField and a <form>, with
     the bound value echoed, a fixed starting month and en-AU order. -->
<script lang="ts">
  import { parseDate, type DateValue } from '@internationalized/date';
  import DatePicker from '../../../src/lib/fields/DatePicker.svelte';
  import DateRangePicker from '../../../src/lib/fields/DateRangePicker.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';

  interface Props {
    range?: boolean | undefined;
    minDays?: number | undefined;
  }

  let { range = false, minDays }: Props = $props();

  // A value in October 2026, so the popover opens on a fixed month.
  let single = $state<DateValue | undefined>(parseDate('2026-10-01'));
  let span = $state<{ start: DateValue | undefined; end: DateValue | undefined }>({
    start: parseDate('2026-10-01'),
    end: parseDate('2026-10-02'),
  });
  let posted = $state('');
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    posted = range ? `${String(data.get('from'))}..${String(data.get('to'))}` : String(data.get('sown'));
  }}
>
  <FormField label={range ? 'Season' : 'Sown on'} hint="As on the seed packet.">
    {#snippet children(control)}
      {#if range}
        <DateRangePicker {...control} bind:value={span} startName="from" endName="to" locales="en-AU" {minDays} />
      {:else}
        <DatePicker {...control} bind:value={single} name="sown" locales="en-AU" />
      {/if}
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">
  {range ? `${span.start?.toString() ?? ''}..${span.end?.toString() ?? ''}` : (single?.toString() ?? '')}
</p>
<p data-testid="posted">{posted}</p>
