<!-- @component
`EventCalendar`'s agenda: a heading per day that has events, and a list of them. Internal.
-->
<script lang="ts">
  import type { CalendarDate } from '@internationalized/date';
  import CalendarEventItem from './CalendarEventItem.svelte';
  import type { CalendarEvent, PlacedEvent } from './events.ts';

  interface Props {
    days: readonly { readonly day: CalendarDate; readonly heading: string; readonly events: readonly PlacedEvent[] }[];
    timeOf: (placed: PlacedEvent) => string;
    describe: (placed: PlacedEvent, day: CalendarDate) => string;
    noEventsLabel: string;
    onSelect: ((event: CalendarEvent) => void) | undefined;
  }

  let { days, timeOf, describe, noEventsLabel, onSelect }: Props = $props();
</script>

{#if days.length === 0}
  <p class="text-base-content/70 py-6 text-center">{noEventsLabel}</p>
{/if}
{#each days as entry (entry.day.toString())}
  <section class="border-base-300 border-b py-2 last:border-b-0">
    <h3 class="text-sm font-semibold">{entry.heading}</h3>
    <ul class="mt-1 flex flex-col gap-0.5">
      {#each entry.events as placed (placed.event.id)}
        <li>
          <CalendarEventItem
            {placed}
            time={timeOf(placed)}
            description={describe(placed, entry.day)}
            {onSelect}
          />
        </li>
      {/each}
    </ul>
  </section>
{/each}
