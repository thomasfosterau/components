<!--
  SegmentBar — one horizontal bar split into proportional, coloured segments:
  a vote share, a storage breakdown, a pass/fail split.

  ARIA contract, and the whole reason this is a component: the bar is a
  SINGLE `role="img"` whose `aria-label` spells out every segment ("Storage:
  photos 62%, video 31%, other 7%"), so assistive technology gets the picture
  in one read. The alternative — a run of coloured boxes, each with its own
  label — is a dozen unlabelled or half-labelled announcements that never add
  up to the comparison the bar is drawn to make. Every segment is therefore
  `aria-hidden`, and the in-segment percentages are decorative.

  Fractions are given, not derived from values: the caller already knows its
  denominator (and whether the remainder should stay unfilled), and passing
  shares keeps this component out of the business of summing anything. They
  are clamped, and a total under 1 leaves the track showing.

  A segment's colour is either a semantic `tone` or a `colourToken` — a CSS
  custom-property NAME the app's theme declares in both its light and dark
  themes. The value never appears here; see `ui/colour-token.ts`.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { backgroundTone, type Tone } from '../ui/tones.ts';
  import { colourTokenStyle } from '../ui/colour-token.ts';
  import { barSize, type BarSize } from './sizes.ts';

  /** The custom property a segment's `colourToken` is bound to. */
  const SEGMENT_COLOUR_PROPERTY = '--segment-colour';

  export interface BarSegment {
    /** Read out for this segment in the bar's accessible label. */
    readonly label: string;
    /** Share of the whole bar, in `[0, 1]`. */
    readonly fraction: number;
    /** A CSS custom-property name the app's theme declares (`--party-alp`). */
    readonly colourToken?: string | undefined;
    /** Semantic colour, used when there is no `colourToken`. */
    readonly tone?: Tone | undefined;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
    /** What the bar shows. Leads the accessible label. */
    label: string;
    segments: readonly BarSegment[];
    /** Print each segment's percentage inside it when it fits. */
    showValues?: boolean | undefined;
    /** Draw a marker at this fraction — a 50% majority line, a quota. */
    marker?: number | undefined;
    size?: BarSize | undefined;
    /** Locale(s) for the percentages. Defaults to the components context's. */
    locales?: string | readonly string[] | undefined;
    class?: string | undefined;
  }

  let {
    label,
    segments,
    showValues = false,
    marker,
    size = 'md',
    locales,
    class: className,
    ...rest
  }: Props = $props();

  const context = getComponentsContext();

  const clamp = (fraction: number): number => Math.min(1, Math.max(0, fraction));

  const percent = $derived(
    new Intl.NumberFormat(locales ?? context.locale(), {
      style: 'percent',
      maximumFractionDigits: 1,
    }),
  );

  const shares = $derived(
    segments.map((segment) => ({ segment, fraction: clamp(segment.fraction) })),
  );

  const description = $derived(
    `${label}: ${shares
      .map(({ segment, fraction }) => `${segment.label} ${percent.format(fraction)}`)
      .join(', ')}`,
  );
</script>

<div
  {...rest}
  role="img"
  aria-label={description}
  class={[
    'bg-base-300 relative flex w-full overflow-hidden rounded-(--radius-selector)',
    barSize[size],
    className,
  ]}
>
  {#each shares as { segment, fraction }, index (index)}
    <div
      aria-hidden="true"
      class={[
        'flex h-full items-center justify-center overflow-hidden text-xs font-medium whitespace-nowrap',
        segment.colourToken === undefined
          ? [backgroundTone[segment.tone ?? 'neutral'], 'text-neutral-content']
          : 'text-base-100 bg-(--segment-colour)',
      ]}
      style={[
        `width: ${(fraction * 100).toFixed(2)}%`,
        colourTokenStyle(SEGMENT_COLOUR_PROPERTY, segment.colourToken),
      ]
        .filter((part) => part !== undefined)
        .join('; ')}
    >
      {#if showValues && size !== 'sm' && fraction >= 0.08}
        {percent.format(fraction)}
      {/if}
    </div>
  {/each}
  {#if marker !== undefined}
    <div
      aria-hidden="true"
      class="bg-base-content absolute inset-y-0 w-0.5"
      style={`left: ${(clamp(marker) * 100).toFixed(2)}%`}
    ></div>
  {/if}
</div>
