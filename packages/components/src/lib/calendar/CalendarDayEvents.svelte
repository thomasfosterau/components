<!-- @component
One month cell's contents: the day number, its first events and an "n more" popover with them all. Internal.
-->
<script lang="ts">
  import type { CalendarDate } from '@internationalized/date';
  import { Popover } from 'bits-ui';
  import CalendarEventItem from './CalendarEventItem.svelte';
  import type { CalendarEvent, PlacedEvent } from './events.ts';

  interface Props {
    day: CalendarDate;
    number: number;
    isToday: boolean;
    events: readonly PlacedEvent[];
    maxPerDay: number;
    /** The day's full name, for the popover. */
    label: string;
    moreLabel: (count: number) => string;
    timeOf: (placed: PlacedEvent) => string;
    describe: (placed: PlacedEvent, day: CalendarDate) => string;
    onSelect: ((event: CalendarEvent) => void) | undefined;
  }

  let {
    day,
    number,
    isToday,
    events,
    maxPerDay,
    label,
    moreLabel,
    timeOf,
    describe,
    onSelect,
  }: Props = $props();

  const shown = $derived(events.length > maxPerDay ? events.slice(0, maxPerDay) : events);
</script>

<span
  aria-hidden="true"
  class={[
    'mb-0.5 inline-flex size-6 items-center justify-center rounded-full text-xs',
    isToday && 'bg-primary text-primary-content font-semibold',
  ]}>{number}</span
>
<div class="flex flex-col gap-0.5">
  {#each shown as placed (placed.event.id)}
    <CalendarEventItem
      {placed}
      time={timeOf(placed)}
      description={describe(placed, day)}
      tabindex={-1}
      compact
      {onSelect}
    />
  {/each}
  {#if events.length > shown.length}
    <Popover.Root>
      <Popover.Trigger
        data-more
        tabindex={-1}
        class="link link-hover px-1 text-start text-xs"
      >
        {moreLabel(events.length - shown.length)}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          role="dialog"
          aria-label={label}
          sideOffset={4}
          class="bg-base-100 rounded-box border-base-300 z-50 flex w-60 flex-col gap-0.5 border p-2 shadow-lg"
        >
          {#each events as placed (placed.event.id)}
            <CalendarEventItem
              {placed}
              time={timeOf(placed)}
              description={describe(placed, day)}
              compact
              {onSelect}
            />
          {/each}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  {/if}
</div>
