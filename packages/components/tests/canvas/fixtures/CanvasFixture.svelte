<!--
  Fixture for `VectorCanvas`, which is generic over its element type and takes
  a renderer snippet — neither of which survives a plain
  `render(Component, props)` from a `.ts` spec.

  It also plays the part the application plays: the canvas REPORTS a viewport
  change rather than mutating the document, so something has to accept the
  report and hand back a new document. That is what this does, and the spec
  reads the result off the `data-*` attributes below.

  Positioned at the top-left of the page with no margin so that a pointer
  position expressed relative to the element is the same number the canvas
  reads back out of `getBoundingClientRect()`.
-->
<script lang="ts">
  import VectorCanvas from '../../../src/lib/canvas/VectorCanvas.svelte';
  import type {
    CanvasElement,
    Point,
    VectorDocument,
    Viewport,
  } from '../../../src/lib/canvas/types.ts';

  interface Props {
    interactive?: boolean;
    snap?: boolean;
    tool?: string;
  }

  let { interactive = true, snap = false, tool = 'select' }: Props = $props();

  const element: CanvasElement = {
    id: 'one',
    type: 'node',
    position: { x: 20, y: 20 },
    rotation: 0,
    zIndex: 0,
    strokeColor: '',
    strokeWidth: 1,
    fillColor: '',
    opacity: 1,
    locked: false,
  };

  // Seeded from the props once: these fixtures mount with the shape a spec
  // wants and never change it mid-test.
  let doc = $state<VectorDocument>({
    version: '1',
    metadata: {},
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    // svelte-ignore state_referenced_locally
    grid: { visible: true, size: 10, snap, color: '#000' },
    elements: [element],
  });

  /** The gestures the canvas reported, newest last. */
  let gestures = $state<readonly { phase: string; point: Point }[]>([]);

  /**
   * Published rounded, because a REAL pointer lands on a real sub-pixel: the
   * browser reports a press at "40" as 39.9964, and the canvas is right to pass
   * that on. The claim a spec makes is which canvas unit a gesture reported,
   * and rounding here is how it says exactly that instead of pinning the
   * device-pixel arithmetic of one machine.
   */
  const whole = (value: number): number => Math.round(value);
</script>

<div
  data-testid="canvas-state"
  data-offset-x={whole(doc.viewport.offsetX)}
  data-offset-y={whole(doc.viewport.offsetY)}
  data-zoom={doc.viewport.zoom}
  data-gestures={gestures
    .map((entry) => `${entry.phase}:${whole(entry.point.x)},${whole(entry.point.y)}`)
    .join('|')}
>
  <VectorCanvas
    {doc}
    {interactive}
    {tool}
    width={200}
    height={200}
    onviewportchange={(viewport: Viewport) => {
      doc = { ...doc, viewport };
    }}
    oninteract={(event) => {
      gestures = [...gestures, { phase: event.phase, point: event.point }];
    }}
  >
    {#snippet element(shape: CanvasElement, selected: boolean)}
      <rect
        data-testid="shape-{shape.id}"
        data-selected={selected}
        x={shape.position.x}
        y={shape.position.y}
        width="10"
        height="10"
      />
    {/snippet}
  </VectorCanvas>
</div>
