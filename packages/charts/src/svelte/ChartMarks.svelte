<!--
  @component A chart's marks as SVG: one path per series for lines and areas, a rect per bar, a circle per point, a labelled box per tree node with its links.
-->
<script lang="ts">
  import type { BarRect, Geometry, PointCircle, Series, TreeGeometry } from '@thomasfosterau/charts/core';
  import { CATEGORICAL_PALETTE } from '@thomasfosterau/charts/core';

  interface Props {
    /** The mark geometry from `computeContext`. */
    geometry: Geometry;
  }

  let { geometry }: Props = $props();

  const DEFAULT_COLOR = CATEGORICAL_PALETTE[0];
  const LINK_COLOR = '#9ca3af';
  const NODE_TEXT_COLOR = '#111827';
</script>

{#snippet seriesPaths(series: ReadonlyArray<Series>, filled: boolean)}
  {#each series.filter((line) => line.path.length > 0) as line, index (line.key ?? index)}
    {#if filled}
      <path d={line.path} fill={line.color ?? DEFAULT_COLOR} fill-opacity="0.7" stroke="none" />
    {:else}
      <path d={line.path} fill="none" stroke={line.color ?? DEFAULT_COLOR} stroke-width="2" />
    {/if}
  {/each}
{/snippet}

{#snippet bars(rects: ReadonlyArray<BarRect>)}
  {#each rects as bar, index (index)}
    <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill={bar.color ?? DEFAULT_COLOR} />
  {/each}
{/snippet}

{#snippet points(circles: ReadonlyArray<PointCircle>)}
  {#each circles as point, index (index)}
    <circle cx={point.cx} cy={point.cy} r={point.r} fill={point.color ?? DEFAULT_COLOR} />
  {/each}
{/snippet}

{#snippet tree(shape: TreeGeometry)}
  {#each shape.links as link (`${link.from}->${link.to}`)}
    <path d={link.path} fill="none" stroke={LINK_COLOR} />
  {/each}
  {#each shape.nodes as node (node.id)}
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx="4"
        fill="#ffffff"
        stroke={node.color ?? DEFAULT_COLOR}
        stroke-width="1.5"
      />
      <text
        x={node.x + node.width / 2}
        y={node.y + node.height / 2}
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="system-ui, sans-serif"
        font-size="11"
        fill={NODE_TEXT_COLOR}>{node.label}</text
      >
    </g>
  {/each}
{/snippet}

<g data-mark={geometry.mark}>
  {#if geometry.mark === 'line'}
    {@render seriesPaths(geometry.series, false)}
  {:else if geometry.mark === 'area'}
    {@render seriesPaths(geometry.series, true)}
  {:else if geometry.mark === 'bar'}
    {@render bars(geometry.bars)}
  {:else if geometry.mark === 'tree'}
    {@render tree(geometry)}
  {:else}
    {@render points(geometry.points)}
  {/if}
</g>
