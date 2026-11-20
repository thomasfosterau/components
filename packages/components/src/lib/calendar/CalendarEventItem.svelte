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
    onSelect: ((event: PlacedEvent['event']) => void) | undefined;
  }

  let { placed, time, description, tabindex = 0, compact = false, onSelect }: Props = $props();

  const context = getComponentsContext();
  const uid = $props.id();
  const event = $derived(placed.event);
  const classes = $derived([
    'hover:bg-base-200 focus-visible:outline-primary flex w-full min-w-0 items-center gap-1.5 rounded text-start focus-visible:outline-2',
    compact ? 'px-1 text-xs' : 'px-2 py-1',
  ]);
</script>

{#snippet body()}
  <span
    aria-hidden="true"
    class={['status shrink-0', statusTone[event.tone ?? 'neutral']]}
  ></span>
  {#if time !== ''}<span aria-hidden="true" class="shrink-0 tabular-nums opacity-70">{time}</span>{/if}
  <span class="truncate">{event.title}</span>
{/snippet}

{#if event.href !== undefined}
  <a
    href={context.href(event.href)}
    {tabindex}
    aria-describedby={uid}
    data-event
    class={classes}
  >
    {@render body()}
  </a>
{:else}
  <button
    type="button"
    {tabindex}
    aria-describedby={uid}
    data-event
    class={classes}
    onclick={() => onSelect?.(event)}
  >
    {@render body()}
  </button>
{/if}
<span id={uid} hidden>{description}</span>
