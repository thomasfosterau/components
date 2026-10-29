<!-- A DateField or TimeField inside a FormField and a <form>, with the bound
     value echoed, so tests can read the label wiring, the binding and the
     posted FormData. -->
<script lang="ts">
  import { parseDate, type DateValue } from '@internationalized/date';
  import DateField from '../../../src/lib/fields/DateField.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import TimeField from '../../../src/lib/fields/TimeField.svelte';
  import type { TimeValue } from '../../../src/lib/fields/segmented-field.ts';

  interface Props {
    kind?: 'date' | 'time' | undefined;
    value?: string | undefined;
    locales?: string | undefined;
    hourCycle?: 12 | 24 | undefined;
    invalid?: boolean | undefined;
  }

  let { kind = 'date', value: initial, locales, hourCycle, invalid }: Props = $props();

  // svelte-ignore state_referenced_locally
  let date = $state<DateValue | undefined>(initial === undefined ? undefined : parseDate(initial));
  let time = $state<TimeValue | undefined>();
  let posted = $state('');
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    posted = String(new FormData(event.currentTarget).get('when') ?? '');
  }}
>
  <FormField
    label={kind === 'date' ? 'Sown on' : 'Water at'}
    hint="As on the seed packet."
    {...invalid ? { errors: ['Pick a day.'] } : {}}
  >
    {#snippet children(control)}
      {#if kind === 'date'}
        <DateField {...control} bind:value={date} name="when" {locales} />
      {:else}
        <TimeField {...control} bind:value={time} name="when" {locales} {hourCycle} />
      {/if}
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{kind === 'date' ? (date?.toString() ?? '') : (time?.toString() ?? '')}</p>
<p data-testid="posted">{posted}</p>
