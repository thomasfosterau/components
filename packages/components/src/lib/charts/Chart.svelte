<!--
  Chart — a line, area or bar chart drawn as plain SVG from a declarative
  series spec.

  It takes no charting dependency, deliberately: scales over a bounded category
  axis are arithmetic, and a charting library behind a package's entry point is
  not worth the bytes when the whole of what it would supply is four functions.

  Rules it enforces rather than leaves to the caller, because a chart that gets
  them wrong is a chart that misleads:

  - **One y axis.** Two measures of different scale are two charts. There is no
    prop for a second scale, deliberately.
  - **The zero line is drawn.** A bar chart whose baseline is not zero
    exaggerates every difference on it; this one starts its domain at zero (or
    at the minimum, when values go negative) and says so on the axis.
  - **Identity is never colour alone.** Two or more series always get a legend;
    four or fewer also get a direct label on their last point. The series colour
    is on the mark, never on the text beside it.
  - **The numbers are readable without seeing.** A `<table>` of the same data is
    always in the DOM — visually hidden by default, revealed with `showTable` —
    so a reader who cannot resolve the colours still has the figures.

  Colour comes from the theme's four validated chart slots
  (`--color-chart-1…4`, see `theme.css`). Slots are assigned by series ORDER and
  never cycled: a fifth series is a design problem — fold it into an "other"
  series, or facet — not a generated hue, so it draws in the neutral slot and
  the legend says which one it is.

  ## ARIA contract

  The `<svg>` is `role="img"` named by `title`, so a screen reader is told it is
  one picture rather than walked through several hundred unlabelled shapes. The
  figures themselves are reached through the always-present `<table>`, captioned
  by `tableLabel` (which defaults to `title`) with the categories as row headers
  and the series as column headers. The legend, when there is one, is a list
  named by `legendLabel`. Every one of those strings is a prop with an English
  default; nothing here reads copy from a context.

  Hand-rolled rather than built on a bits-ui primitive because bits-ui has no
  chart: this is geometry and a table, not a focus-managed widget.
-->
<script lang="ts">
  import type { ChartKind, ChartSeries } from './types.ts';

  interface Props {
    /** One entry per series, sharing the first series' categories. */
    series: readonly ChartSeries[];
    kind?: ChartKind;
    /** Names the figure; rendered as its caption and its accessible name. */
    title: string;
    /** A sentence of context under the title. */
    description?: string;
    /** Plot height in CSS pixels; the width is fluid. */
    height?: number;
    /** Reveal the data table rather than leaving it to assistive tech. */
    showTable?: boolean;
    /** Names the series legend; only rendered when there are two or more. */
    legendLabel?: string;
    /** Captions the data table. Empty means "use `title`". */
    tableLabel?: string;
    /** Heads the table's category column. */
    categoryLabel?: string;
    /** Rendered value text — a unit, a locale-formatted number. */
    formatValue?: (value: number) => string;
    class?: string | undefined;
  }

  let {
    series,
    kind = 'line',
    title,
    description = '',
    height = 240,
    showTable = false,
    legendLabel = 'Series',
    tableLabel = '',
    categoryLabel = '',
    formatValue = (value: number) => String(value),
    class: className,
  }: Props = $props();

  /** The plot's own coordinate system; the SVG scales to its container. */
  const WIDTH = 640;
  const PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

  const caption = $derived(tableLabel === '' ? title : tableLabel);
  const categories = $derived(series[0]?.points.map((point) => point.label) ?? []);
  const values = $derived(series.flatMap((entry) => entry.points.map((point) => point.value)));

  // The domain starts at zero unless the data goes below it. Growing the top by
  // a twentieth keeps the highest mark off the frame without inventing a scale.
  const max = $derived(Math.max(0, ...values) * 1.05 || 1);
  const min = $derived(Math.min(0, ...values));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = $derived(height - PADDING.top - PADDING.bottom);

  const y = $derived((value: number) => {
    const span = max - min || 1;
    return PADDING.top + plotHeight - ((value - min) / span) * plotHeight;
  });
  /** Category centres: a band per category, the mark on its midpoint. */
  const x = $derived((index: number) => {
    const band = plotWidth / Math.max(categories.length, 1);
    return PADDING.left + band * index + band / 2;
  });

  /** Four validated slots, then the neutral one — never a generated hue. */
  const colour = (index: number): string =>
    index < 4 ? `var(--color-chart-${index + 1})` : 'var(--color-neutral)';

  const path = $derived((entry: ChartSeries) =>
    entry.points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)} ${y(point.value)}`)
      .join(' '),
  );
  const areaPath = $derived((entry: ChartSeries) =>
    entry.points.length === 0
      ? ''
      : `${path(entry)} L${x(entry.points.length - 1)} ${y(min)} L${x(0)} ${y(min)} Z`,
  );

  /** Five gridlines, the bottom one being the zero (or minimum) rule. */
  const ticks = $derived(
    Array.from({ length: 5 }, (_unused, step) => min + ((max - min) / 4) * step).reverse(),
  );

  // Bars share a category band: each series takes an equal slice of it, less a
  // 2px gap so adjacent fills never touch and read as one block.
  const barBand = $derived(plotWidth / Math.max(categories.length, 1));
  const barWidth = $derived(Math.max(2, (barBand * 0.7) / Math.max(series.length, 1) - 2));

  /** The category the pointer is over; -1 is "nowhere". */
  let hovered = $state(-1);
  let plot = $state<SVGSVGElement>();

  const track = (event: PointerEvent): void => {
    if (plot === undefined || categories.length === 0) return;
    const box = plot.getBoundingClientRect();
    // The pointer is in CSS pixels and the plot in its own units; scale across
    // rather than assuming they match, because the SVG is fluid.
    const local = ((event.clientX - box.left) / box.width) * WIDTH;
    const band = plotWidth / categories.length;
    const index = Math.floor((local - PADDING.left) / band);
    hovered = index >= 0 && index < categories.length ? index : -1;
  };
</script>

<figure class={['not-prose space-y-2', className]}>
  <figcaption class="space-y-1">
    <p class="text-base font-semibold">{title}</p>
    {#if description !== ''}
      <p class="text-base-content/70 text-sm">{description}</p>
    {/if}
  </figcaption>

  {#if series.length > 1}
    <ul
      aria-label={legendLabel}
      class="text-base-content/80 flex flex-wrap gap-x-4 gap-y-1 text-sm"
    >
      {#each series as entry, index (entry.key)}
        <li class="flex items-center gap-1.5">
          <span
            class="inline-block size-2.5 rounded-full"
            style:background-color={colour(index)}
            aria-hidden="true"
          ></span>
          {entry.label}
        </li>
      {/each}
    </ul>
  {/if}

  <div class="relative">
    <svg
      bind:this={plot}
      viewBox={`0 0 ${WIDTH} ${height}`}
      class="h-auto w-full"
      role="img"
      aria-label={title}
      onpointermove={track}
      onpointerleave={() => {
        hovered = -1;
      }}
    >
      <!-- Grid and axes, recessive: they orient the eye, they are not the data. -->
      {#each ticks as tick (tick)}
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={y(tick)}
          y2={y(tick)}
          class="stroke-base-content/10"
          stroke-width="1"
        />
        <text
          x={PADDING.left - 8}
          y={y(tick) + 4}
          text-anchor="end"
          class="fill-base-content/50 text-[10px]"
        >
          {formatValue(Math.round(tick))}
        </text>
      {/each}
      <line
        x1={PADDING.left}
        x2={WIDTH - PADDING.right}
        y1={y(min)}
        y2={y(min)}
        class="stroke-base-content/30"
        stroke-width="1"
      />

      {#each categories as category, index (category)}
        <text
          x={x(index)}
          y={height - 10}
          text-anchor="middle"
          class="fill-base-content/50 text-[10px]"
        >
          {category}
        </text>
      {/each}

      {#if hovered >= 0 && kind !== 'bar'}
        <line
          x1={x(hovered)}
          x2={x(hovered)}
          y1={PADDING.top}
          y2={PADDING.top + plotHeight}
          class="stroke-base-content/30"
          stroke-width="1"
          stroke-dasharray="3 3"
        />
      {/if}

      {#each series as entry, index (entry.key)}
        {#if kind === 'bar'}
          {#each entry.points as point, pointIndex (point.label)}
            <rect
              x={x(pointIndex) -
                (barWidth * series.length + 2 * (series.length - 1)) / 2 +
                index * (barWidth + 2)}
              y={Math.min(y(point.value), y(0))}
              width={barWidth}
              height={Math.max(1, Math.abs(y(point.value) - y(0)))}
              rx="4"
              fill={colour(index)}
              opacity={hovered === -1 || hovered === pointIndex ? 1 : 0.45}
            />
          {/each}
        {:else}
          {#if kind === 'area'}
            <path d={areaPath(entry)} fill={colour(index)} opacity="0.15" />
          {/if}
          <path
            d={path(entry)}
            fill="none"
            stroke={colour(index)}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          {#if hovered >= 0}
            {@const marked = entry.points[hovered]}
            {#if marked !== undefined}
              <!-- The 2px surface ring is what keeps two markers that land on
                   the same value from reading as one mark. -->
              <circle
                cx={x(hovered)}
                cy={y(marked.value)}
                r="5"
                fill={colour(index)}
                class="stroke-base-100"
                stroke-width="2"
              />
            {/if}
          {/if}
          {#if series.length > 1 && series.length <= 4}
            {@const last = entry.points.at(-1)}
            {#if last !== undefined}
              <text
                x={x(entry.points.length - 1) + 6}
                y={y(last.value) + 3}
                class="fill-base-content/70 text-[10px]"
              >
                {entry.label}
              </text>
            {/if}
          {/if}
        {/if}
      {/each}
    </svg>

    {#if hovered >= 0}
      <!-- Positioned over the plot in percentage terms, so it tracks the fluid
           SVG rather than a width this component does not know. -->
      <div
        class="bg-base-100 border-base-300 rounded-box pointer-events-none absolute top-2 z-10 border p-2 text-xs shadow-md"
        style:left={`calc(${(x(hovered) / WIDTH) * 100}% + 0.5rem)`}
        role="status"
      >
        <p class="font-semibold">{categories[hovered]}</p>
        <ul>
          {#each series as entry, index (entry.key)}
            {@const point = entry.points[hovered]}
            {#if point !== undefined}
              <li class="flex items-center gap-1.5">
                <span
                  class="inline-block size-2 rounded-full"
                  style:background-color={colour(index)}
                  aria-hidden="true"
                ></span>
                <span class="text-base-content/70">{entry.label}</span>
                <span class="font-medium">{formatValue(point.value)}</span>
              </li>
            {/if}
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <!-- The same figures as text. Always present; `showTable` only decides
       whether sighted readers see it too. -->
  <div class={showTable ? 'overflow-x-auto' : 'sr-only'}>
    <table class="table table-sm">
      <caption class="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{categories.length === 0 ? caption : categoryLabel}</th>
          {#each series as entry (entry.key)}
            <th scope="col">{entry.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each categories as category, index (category)}
          <tr>
            <th scope="row">{category}</th>
            {#each series as entry (entry.key)}
              <td>{formatValue(entry.points[index]?.value ?? 0)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</figure>
