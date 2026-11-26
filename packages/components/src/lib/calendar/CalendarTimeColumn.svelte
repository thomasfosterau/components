<!-- @component
One day of `EventCalendar`'s time grid: its heading, a "New event" button, the all-day events and the timed events, positioned by time but in time order in the DOM. Dragging over the hours selects a slot. Internal.
-->
<script lang="ts">
  import type { CalendarDate } from '@internationalized/date';
  import { Plus } from '@lucide/svelte';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import CalendarEventItem from './CalendarEventItem.svelte';
  import type { CalendarEvent, GridHours, PlacedEvent, TimedSegment } from './events.ts';

  interface Props {
    day: CalendarDate;
    /** The visible heading ("Fri 23") and the full date read in its place. */
    shortName: string;
    longName: string;
    isToday: boolean;
    allDay: readonly PlacedEvent[];
    timed: readonly TimedSegment[];
    hours: GridHours;
    /** The hours' height, a CSS length. */
    height: string;
    /** The grid rows this column spans, through CSS subgrid. */
    column: number;
    timeOf: (placed: PlacedEvent) => string;
    /** An event's accessible name: its title and when. */
    nameOf: (placed: PlacedEvent) => string;
    describe: (placed: PlacedEvent, day: CalendarDate) => string;
    newEventLabel: string;
    onSelect: ((event: CalendarEvent) => void) | undefined;
    /** "New event" was pressed. */
    onNew: (() => void) | undefined;
    /** A drag over the hours ended, in minutes from midnight. */
    onDrag: ((from: number, to: number) => void) | undefined;
  }

  let {
    day,
    shortName,
    longName,
    isToday,
    allDay,
    timed,
    hours,
    height,
    column,
    timeOf,
    nameOf,
    describe,
    newEventLabel,
    onSelect,
    onNew,
    onDrag,
  }: Props = $props();

  const uid = $props.id();
  const first = $derived(hours[0] * 60);
  const total = $derived((hours[1] - hours[0]) * 60);
  const percent = (minutes: number): string => `${(minutes / total) * 100}%`;
  const lines = $derived(Array.from({ length: hours[1] - hours[0] }, (_, index) => index));

  let area: HTMLElement | undefined = $state();
  let drag: { readonly from: number; readonly to: number } | undefined = $state();

  const minuteAt = (clientY: number): number => {
    const rect = area?.getBoundingClientRect();
    if (rect === undefined || rect.height === 0) return first;
    const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return first + ratio * total;
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (onDrag === undefined || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('[data-event]') !== null) return;
    const minute = minuteAt(event.clientY);
    drag = { from: minute, to: minute };
    try {
      area?.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic pointer can't be captured; the drag still ends on this element.
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (drag !== undefined) drag = { from: drag.from, to: minuteAt(event.clientY) };
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (drag === undefined) return;
    const { from } = drag;
    drag = undefined;
    onDrag?.(from, minuteAt(event.clientY));
  };

  const preview = $derived(
    drag === undefined
      ? undefined
      : {
          top: percent(Math.min(drag.from, drag.to) - first),
          height: percent(Math.abs(drag.to - drag.from)),
        },
  );
</script>

<section
  aria-labelledby={uid}
  aria-current={isToday ? 'date' : undefined}
  class="border-base-300 border-s"
  style:grid-column={column}
  style:grid-row="1 / span 3"
  style:display="grid"
  style:grid-template-rows="subgrid"
  style:min-width="0"
>
  <div class="flex items-center gap-1 px-1 py-1">
    <h3 id={uid} class="me-auto min-w-0 truncate text-sm font-medium">
      <span
        aria-hidden="true"
        class={[isToday && 'bg-primary text-primary-content rounded-full px-1.5 font-semibold']}
        >{shortName}</span
      >
      <span class="sr-only">{longName}</span>
    </h3>
    {#if onNew !== undefined}
      <IconButtonCore label={newEventLabel} size="xs" variant="ghost" onclick={onNew}>
        {#snippet icon()}<Plus class="size-3.5" />{/snippet}
      </IconButtonCore>
    {/if}
  </div>
  <ul class="border-base-300 flex min-h-6 flex-col gap-0.5 border-b p-0.5">
    {#each allDay as placed (placed.event.id)}
      <li>
        <CalendarEventItem
          {placed}
          time=""
          label={nameOf(placed)}
          description={describe(placed, day)}
          compact
          {onSelect}
        />
      </li>
    {/each}
  </ul>
  <!-- Pointer-only: each day's "New event" button is the keyboard path. -->
  <div
    bind:this={area}
    role="presentation"
    data-hours
    class={[onDrag !== undefined && 'cursor-cell']}
    style:position="relative"
    style:height
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={() => {
      drag = undefined;
    }}
  >
    {#each lines as line (line)}
      <div
        aria-hidden="true"
        class="border-base-300 pointer-events-none border-t"
        style:position="absolute"
        style:inset-inline="0"
        style:top={percent(line * 60)}
      ></div>
    {/each}
    {#if preview !== undefined}
      <div
        aria-hidden="true"
        class="bg-primary/20 pointer-events-none rounded"
        style:position="absolute"
        style:inset-inline="0"
        style:top={preview.top}
        style:height={preview.height}
      ></div>
    {/if}
    <ul>
      {#each timed as segment (segment.placed.event.id)}
        <li
          style:position="absolute"
          style:top={percent(segment.start - first)}
          style:height={percent(segment.end - segment.start)}
          style:inset-inline-start={`${(segment.column / segment.columns) * 100}%`}
          style:width={`calc(${(segment.span / segment.columns) * 100}% - 2px)`}
          style:padding-block="1px"
          style:box-sizing="border-box"
        >
          <CalendarEventItem
            placed={segment.placed}
            time={timeOf(segment.placed)}
            label={nameOf(segment.placed)}
            description={describe(segment.placed, day)}
            block
            {onSelect}
          />
        </li>
      {/each}
    </ul>
  </div>
</section>
