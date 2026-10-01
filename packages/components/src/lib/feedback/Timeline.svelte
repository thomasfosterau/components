<!-- @component
A vertical daisyUI `timeline` of dated entries.
-->
<!--
  Timeline — a vertical daisyUI `timeline` of dated entries: offices held,
  releases shipped, a plant's life in a bed.

  An `<ol>` because the order is the content: read out of sequence the list
  means something else. Each entry shows its span on the start side, a marker
  in the middle (filled for an open-ended, still-current entry, tinted with
  the caller's colour token when given) and a `timeline-box` with the entry
  itself.

  ARIA contract: native list semantics plus an `aria-label` on the list, so a
  reader hears what the sequence is before its length. The dash between the
  two dates is `aria-hidden` and `toLabel` is read in its place — "May 2019 –
  May 2022" is announced as a range, not a subtraction — and an open-ended
  entry is introduced by `currentLabel` rather than by the filled marker
  alone. Both markers are `aria-hidden`.

  `colourToken` is a CSS custom-property NAME the app's theme declares; the
  colour value itself never appears here. See `ui/colour-token.ts`.
-->
<script lang="ts">
  import { Circle, CircleDot } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLOlAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { colourTokenStyle } from '../ui/colour-token.ts';

  /** The custom property an entry's `colourToken` is bound to. */
  const TIMELINE_COLOUR_PROPERTY = '--timeline-colour';

  export interface TimelineDate {
    /** Display text, e.g. `March 1996`. */
    readonly label: string;
    /** Machine-readable `<time datetime>` value, e.g. `1996-03-02`. */
    readonly dateTime?: string | undefined;
  }

  export interface TimelineEntry {
    readonly id: string;
    /** The entry itself — the line in the box. */
    readonly label: string;
    /** Second line under it. */
    readonly subtitle?: string | undefined;
    readonly start: TimelineDate;
    /** Omit for an open-ended, still-current entry. */
    readonly end?: TimelineDate | undefined;
    /** Links the entry's label, through the components context. */
    readonly href?: string | undefined;
    /** A CSS custom-property name the app's theme declares (`--party-alp`). */
    readonly colourToken?: string | undefined;
  }

  interface Props extends Omit<HTMLOlAttributes, 'children'> {
    /** The entries, in display order. */
    items: readonly TimelineEntry[];
    /**
     * Shown in place of a missing `end`.
     * @defaultValue `'present'`
     */
    presentLabel?: string | undefined;
    /**
     * Read between the two dates of a span.
     * @defaultValue `'to'`
     */
    toLabel?: string | undefined;
    /**
     * Introduces an open-ended entry.
     * @defaultValue `'Current'`
     */
    currentLabel?: string | undefined;
    /**
     * Accessible name of the list.
     * @defaultValue `'Timeline'`
     */
    label?: string | undefined;
    /** Replaces the default box body. */
    item?: Snippet<[TimelineEntry]> | undefined;
  }

  let {
    items,
    presentLabel = 'present',
    toLabel = 'to',
    currentLabel = 'Current',
    label = 'Timeline',
    item: itemBody,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();
</script>

<ol
  {...rest}
  aria-label={label}
  class={['timeline timeline-vertical timeline-compact timeline-snap-icon', className]}
>
  {#each items as entry, index (entry.id)}
    {@const current = entry.end === undefined}
    <li style={colourTokenStyle(TIMELINE_COLOUR_PROPERTY, entry.colourToken)}>
      {#if index > 0}<hr />{/if}
      <div class="timeline-start text-base-content/70 mb-2 text-sm tabular-nums md:mb-0">
        <time datetime={entry.start.dateTime}>{entry.start.label}</time>
        <span aria-hidden="true">–</span>
        <span class="sr-only">{toLabel}</span>
        {#if entry.end === undefined}
          <span>{presentLabel}</span>
        {:else}
          <time datetime={entry.end.dateTime}>{entry.end.label}</time>
        {/if}
      </div>
      <div
        class={[
          'timeline-middle',
          entry.colourToken === undefined
            ? 'text-base-content/60'
            : 'text-(--timeline-colour)',
        ]}
      >
        {#if current}
          <CircleDot class="size-5" aria-hidden="true" />
          <span class="sr-only">{currentLabel}</span>
        {:else}
          <Circle class="size-5" aria-hidden="true" />
        {/if}
      </div>
      <div class="timeline-end timeline-box">
        {#if itemBody}
          {@render itemBody(entry)}
        {:else}
          <p class="font-medium">
            {#if entry.href !== undefined}
              <a href={context.href(entry.href)} class="link link-hover">{entry.label}</a>
            {:else}
              {entry.label}
            {/if}
          </p>
          {#if entry.subtitle !== undefined}
            <p class="text-base-content/70 text-sm">{entry.subtitle}</p>
          {/if}
        {/if}
      </div>
      {#if index < items.length - 1}<hr />{/if}
    </li>
  {/each}
</ol>
