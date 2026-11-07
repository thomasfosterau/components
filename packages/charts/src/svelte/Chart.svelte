<!--
  @component Renders a portable chart spec as an SVG named by its title, with its data as a visually hidden table; a newer spec's unknown mark as that table, visible; or a fallback when the spec or its data is unusable.

  Pure rendering: the geometry comes from
  `resolveChart` in a `$derived`, so the component renders the same under
  `svelte/server` and on the client. The SVG uses a viewBox, so it scales to
  its container with CSS. Colours are the core palette's and the shared
  interpreter greys, not daisyUI tokens: the chart must look the same as the
  spec's other renderers, which have no theme.
-->
<script lang="ts">
  import type { ChartSpec } from '@thomasfosterau/charts';
  import type { DataRows, DataTable, Margins } from '@thomasfosterau/charts/core';
  import { outlineText, resolveChart, VISUALLY_HIDDEN_STYLE } from '@thomasfosterau/charts/core';
  import type { TreeOutlineNode } from '@thomasfosterau/charts/core';
  import type { Snippet } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';
  import ChartAxes from './ChartAxes.svelte';
  import ChartMarks from './ChartMarks.svelte';

  interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'viewBox'> {
    /** The portable chart spec. Validated again at render time, since specs come from documents. */
    spec: ChartSpec;
    /** Resolved data rows. Required when the spec's data is a reference; replaces inline values when given. */
    data?: DataRows | undefined;
    /**
     * Outer width in pixels; sets the `viewBox`, and with it the aspect ratio.
     * @defaultValue 640
     */
    width?: number | undefined;
    /**
     * Outer height in pixels.
     * @defaultValue 360
     */
    height?: number | undefined;
    /** Margin overrides, merged over the core's `DEFAULT_MARGINS`. */
    margins?: Partial<Margins> | undefined;
    /** Rendered instead of the chart when the spec is invalid, its data is missing or the geometry fails; receives the message. */
    fallback?: Snippet<[message: string]> | undefined;
    /**
     * The data table's caption when the spec has no `config.title`.
     * @defaultValue 'Chart data'
     */
    tableLabel?: string | undefined;
    /**
     * Joins a range's start and end in the data table.
     * @defaultValue ' to '
     */
    rangeSeparator?: string | undefined;
    /**
     * Shown above the data table when a newer spec's mark is one this version cannot draw.
     * @defaultValue 'This chart type is not supported here, so its data is shown as a table.'
     */
    unsupportedMessage?: string | undefined;
  }

  let {
    spec,
    data,
    width = 640,
    height = 360,
    margins,
    fallback,
    tableLabel = 'Chart data',
    rangeSeparator = ' to ',
    unsupportedMessage = 'This chart type is not supported here, so its data is shown as a table.',
    class: className,
    ...rest
  }: Props = $props();

  const TITLE_COLOR = '#111827';
  const FONT_FAMILY = 'system-ui, sans-serif';

  const state = $derived(
    resolveChart(spec, { width, height }, data, { margins, rangeSeparator }),
  );
</script>

{#if state.kind === 'error'}
  {#if fallback}
    {@render fallback(state.message)}
  {:else}
    <div class={className} role="alert" data-chart-error="">{state.message}</div>
  {/if}
{:else if state.kind === 'unsupported'}
  <div class={className} data-chart-unsupported="">
    <p>{unsupportedMessage}</p>
    {@render dataTable(state.table, undefined)}
  </div>
{:else}
  {@const { dimensions, ticks, geometry } = state.context}
  {@const title = state.spec.config?.title}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
    {...rest}
    viewBox="0 0 {dimensions.outer.width} {dimensions.outer.height}"
    class={className}
  >
    {#if title}
      <text
        x={dimensions.outer.width / 2}
        y={dimensions.margins.top / 2}
        text-anchor="middle"
        dominant-baseline="middle"
        font-family={FONT_FAMILY}
        font-size="14"
        font-weight="600"
        fill={TITLE_COLOR}>{title}</text
      >
    {/if}
    <g transform="translate({dimensions.margins.left},{dimensions.margins.top})">
      {#if geometry.mark !== 'tree'}<ChartAxes {ticks} plot={dimensions.plot} />{/if}
      <ChartMarks {geometry} />
    </g>
  </svg>
  {#if geometry.mark === 'tree'}
    <!-- A tree's children are presentational inside role="img", so its text
         alternative (the nested outline) is a sibling of the SVG. -->
    <div style={VISUALLY_HIDDEN_STYLE} data-chart-outline="">{@render outlineList(geometry.outline)}</div>
  {/if}
  <!-- The data as a table, for the same reason a sibling of the SVG. -->
  {@render dataTable(state.table, VISUALLY_HIDDEN_STYLE)}
{/if}

{#snippet dataTable(table: DataTable, style: string | undefined)}
  <table {style} data-chart-table="">
    <caption>{table.caption ?? tableLabel}</caption>
    <thead>
      <tr>
        {#each table.columns as column (column.channels.join())}
          <th scope="col">{column.header}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table.rows as row, index (index)}
        <tr>
          {#each row as cell, column (column)}
            <td>{cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

{#snippet outlineList(nodes: ReadonlyArray<TreeOutlineNode>)}
  <ul>
    {#each nodes as node (node.id)}
      <li>
        {outlineText(node)}
        {#if node.children.length > 0}{@render outlineList(node.children)}{/if}
      </li>
    {/each}
  </ul>
{/snippet}
