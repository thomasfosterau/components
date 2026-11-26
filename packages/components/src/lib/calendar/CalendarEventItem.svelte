<!-- @component
One event as a link (with `href`) or a button: named by its title, described by its date, time and category. Internal.
-->
<script lang="ts">
  import { getComponentsContext } from '../context.svelte.ts';
  import { statusTone } from '../ui/tones.ts';
  import type { PlacedEvent } from './events.ts';

  interface Props {
    placed: PlacedEvent;
    /** The visible time, before the title ("9:00"), or nothing for an all-day event. */
    time: string;
    /** The description read after the title. */
    description: string;
    /** `-1` inside the month grid, where Enter reaches the events. */
    tabindex?: 0 | -1 | undefined;
    /** Compact, for a month cell. */
    compact?: boolean | undefined;
    /** A block filling its time-grid slot, named by title and time. */
    block?: boolean | undefined;
    /** The accessible name, when it says more than the title. */
    label?: string | undefined;
    onSelect: ((event: PlacedEvent['event']) => void) | undefined;
  }

  let {
    placed,
    time,
    description,
    tabindex = 0,
    compact = false,
    block = false,
    label,
    onSelect,
  }: Props = $props();

  const context = getComponentsContext();
  const uid = $props.id();
  const event = $derived(placed.event);
  const classes = $derived([
    'focus-visible:outline-primary flex w-full min-w-0 gap-1.5 rounded text-start focus-visible:outline-2',
    block
      ? 'bg-base-200 border-base-300 hover:bg-base-300 items-start overflow-hidden border px-1 py-0.5 text-xs'
      : 'hover:bg-base-200 items-center',
    !block && (compact ? 'px-1 text-xs' : 'px-2 py-1'),
  ]);
  // Inline, so a block fills its slot even where no stylesheet has loaded.
  const style = $derived(block ? 'width:100%;height:100%;overflow:hidden;box-sizing:border-box' : undefined);
</script>

{#snippet body()}
  <span
    aria-hidden="true"
    class={['status shrink-0', block && 'mt-1', statusTone[event.tone ?? 'neutral']]}
  ></span>
  {#if time !== ''}<span aria-hidden="true" class="shrink-0 tabular-nums opacity-70">{time}</span>{/if}
  <span class={block ? 'line-clamp-2 font-medium' : 'truncate'}>{event.title}</span>
{/snippet}

{#if event.href !== undefined}
  <a
    href={context.href(event.href)}
    {tabindex}
    aria-label={label}
    aria-describedby={uid}
    data-event
    class={classes}
    {style}
  >
    {@render body()}
  </a>
{:else}
  <button
    type="button"
    {tabindex}
    aria-label={label}
    aria-describedby={uid}
    data-event
    class={classes}
    {style}
    onclick={() => onSelect?.(event)}
  >
    {@render body()}
  </button>
{/if}
<span id={uid} hidden>{description}</span>
