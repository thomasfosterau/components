<!--
  @component The x and y axis lines of a chart's plot area, with tick marks and labels.
-->
<script lang="ts">
  import type { Box, ChartTicks } from '@thomasfosterau/charts/core';

  interface Props {
    /** The tick positions and labels from `computeContext`. */
    ticks: ChartTicks;
    /** The plot area, in pixels relative to its own origin. */
    plot: Box;
  }

  let { ticks, plot }: Props = $props();

  const AXIS_COLOR = '#9ca3af';
  const LABEL_COLOR = '#4b5563';
  const FONT_FAMILY = 'system-ui, sans-serif';
</script>

<g data-axes="">
  <line x1="0" y1={plot.height} x2={plot.width} y2={plot.height} stroke={AXIS_COLOR} />
  <line x1="0" y1="0" x2="0" y2={plot.height} stroke={AXIS_COLOR} />
  {#each ticks.x ?? [] as tick, index (index)}
    <g transform="translate({tick.position},{plot.height})">
      <line y2="6" stroke={AXIS_COLOR} />
      <text
        y="18"
        text-anchor="middle"
        font-family={FONT_FAMILY}
        font-size="11"
        fill={LABEL_COLOR}>{tick.label}</text
      >
    </g>
  {/each}
  {#each ticks.y ?? [] as tick, index (index)}
    <g transform="translate(0,{tick.position})">
      <line x2="-6" stroke={AXIS_COLOR} />
      <text
        x="-10"
        text-anchor="end"
        dominant-baseline="middle"
        font-family={FONT_FAMILY}
        font-size="11"
        fill={LABEL_COLOR}>{tick.label}</text
      >
    </g>
  {/each}
</g>
