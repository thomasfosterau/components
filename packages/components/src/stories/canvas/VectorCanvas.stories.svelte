<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import type { CanvasElement, VectorDocument, Viewport } from '../../lib/canvas/types.ts';
  import VectorCanvas from '../../lib/canvas/VectorCanvas.svelte';

  const node = (id: string, x: number, y: number, fill: string, label: string): CanvasElement => ({
    id,
    type: 'block',
    position: { x, y },
    rotation: 0,
    zIndex: Number(id),
    strokeColor: 'var(--color-base-300)',
    strokeWidth: 1,
    fillColor: fill,
    opacity: 1,
    locked: false,
    label,
  });

  const base: VectorDocument = {
    version: '1',
    metadata: {},
    viewport: { offsetX: 40, offsetY: 40, zoom: 1 },
    grid: { visible: true, size: 40, snap: true, color: 'var(--color-base-300)' },
    elements: [
      node('1', 40, 40, 'var(--color-chart-1)', 'Block 1'),
      node('2', 200, 140, 'var(--color-chart-2)', 'Block 2'),
      node('3', 360, 40, 'var(--color-chart-3)', 'Block 3'),
    ],
  };

  const { Story } = defineMeta({
    title: 'Canvas/VectorCanvas',
    component: VectorCanvas,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component:
            'A pan-and-zoom SVG surface over a document the caller owns. Drag with the pan tool, or scroll to zoom about the pointer. It reports gestures in canvas coordinates and renders nothing itself — the `element` snippet is the application’s.',
        },
      },
    },
  });
</script>

<script lang="ts">
  // The canvas owns the viewport but does not KEEP it: it reports a pan or a
  // zoom and the caller decides what the document becomes. This story is that
  // caller, which is also how an application wires it.
  let doc = $state<VectorDocument>(base);
  const onviewportchange = (viewport: Viewport): void => {
    doc = { ...doc, viewport };
  };
</script>

<Story name="With a renderer">
  <VectorCanvas {doc} tool="pan" width={640} height={360} {onviewportchange}>
    {#snippet element(shape: CanvasElement, selected: boolean)}
      <g transform="translate({shape.position.x},{shape.position.y})">
        <rect
          width="120"
          height="80"
          rx="8"
          fill={shape.fillColor}
          opacity="0.3"
          stroke={selected ? 'var(--color-primary)' : shape.strokeColor}
          stroke-width="2"
        />
        <text x="60" y="44" text-anchor="middle" class="fill-base-content text-xs">
          {shape.label}
        </text>
      </g>
    {/snippet}
  </VectorCanvas>
</Story>

<!-- No renderer: the fallback marker, which exists so an application that has
     forgotten to supply one SEES that it has. -->
<Story name="Fallback markers">
  <VectorCanvas doc={base} width={640} height={360} />
</Story>

<Story name="No grid, not interactive">
  <VectorCanvas
    doc={{ ...base, grid: { ...base.grid, visible: false } }}
    width={640}
    height={280}
    interactive={false}
    label="A read-only diagram"
  />
</Story>
