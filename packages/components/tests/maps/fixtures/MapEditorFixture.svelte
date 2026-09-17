<!--
  Fixture for `MapEditor`, playing the part the owning page plays: it accepts
  the editor's reports, hands back a new document, keeps the undo stack the
  editor deliberately does not keep, and publishes the result on `data-*`
  attributes the spec can read.

  The editor mutates nothing (see its header), so without a caller like this one
  a drag would report and then visibly do nothing — which is also what would
  happen to a page that forgot to wire `onchange`. Recording history only on
  `edit.committed` is the contract that makes one drag one undo; a page that got
  that wrong would record one entry per pointer move, and `data-history` is what
  would show it.

  Coordinates are published ROUNDED: a real pointer lands on a real sub-pixel,
  and the claim a spec makes is which canvas unit an edit reached.

  The two shapes sit clear of the surface's edges so every position a spec
  clicks is inside the element — Playwright measures a click from the element's
  top-left corner, and a coordinate on the boundary is a coordinate that may
  miss.
-->
<script lang="ts">
  import {
    emptyHistory,
    recordEdit,
    redo,
    undo,
    type History,
  } from '../../../src/lib/canvas/history.ts';
  import type { Point, VectorDocument } from '../../../src/lib/canvas/types.ts';
  import MapEditor from '../../../src/lib/maps/MapEditor.svelte';
  import { blankShape, type MapEdit, type MapShape } from '../../../src/lib/maps/shapes.ts';

  interface Props {
    locked?: boolean;
    tool?: 'select' | 'pan' | 'draw-polygon' | 'draw-line';
    /** Whether the page offers defaults for a new shape; absent means drawing is off. */
    drawable?: boolean;
    /** Shapes selected before the first gesture, so a vertex spec need not click twice. */
    selection?: readonly string[];
  }

  let { locked = false, tool = 'select', drawable = false, selection = [] }: Props = $props();

  const area = (id: string, x: number, y: number, zIndex: number): MapShape => ({
    id,
    type: 'polygon',
    position: { x, y },
    rotation: 0,
    zIndex,
    strokeColor: '',
    strokeWidth: 1,
    fillColor: '',
    opacity: 1,
    // svelte-ignore state_referenced_locally
    locked,
    points: [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
      { x: 0, y: 40 },
    ],
  });

  let doc = $state<VectorDocument<MapShape>>({
    version: '1',
    metadata: {},
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    grid: { visible: false, size: 10, snap: false, color: '' },
    elements: [area('near', 20, 20, 0), area('far', 220, 20, 0)],
  });
  // svelte-ignore state_referenced_locally
  let selected = $state<ReadonlySet<string>>(new Set(selection));
  let history = $state<History<MapShape>>(emptyHistory());
  /** Counted rather than random, so a drawn shape has an id a spec can name. */
  let drawnCount = 0;

  const change = (next: VectorDocument<MapShape>, edit: MapEdit): void => {
    doc = next;
    // Timestamped 0: a fixture asserting on history has no business depending
    // on the clock.
    if (edit.committed) history = recordEdit(history, edit.transform, edit.transform.type, 0);
  };

  const stepBack = (): void => {
    const [step] = undo(doc, history);
    if (step === undefined) return;
    doc = step.doc;
    history = step.history;
  };

  const stepForward = (): void => {
    const [step] = redo(doc, history);
    if (step === undefined) return;
    doc = step.doc;
    history = step.history;
  };

  const whole = (value: number): number => Math.round(value);

  const outline = (shape: MapShape): string =>
    `${shape.id}:${(shape.points ?? []).map((point) => `${whole(point.x)},${whole(point.y)}`).join(' ')}`;
</script>

<div
  data-testid="editor-state"
  data-selected={[...selected].join(',')}
  data-positions={doc.elements
    .map((shape) => `${shape.id}@${whole(shape.position.x)},${whole(shape.position.y)}`)
    .join('|')}
  data-outlines={doc.elements.map(outline).join('|')}
  data-kinds={doc.elements.map((shape) => `${shape.id}:${shape.type}`).join('|')}
  data-history="{history.past.length}/{history.future.length}"
  data-entries={history.past.map((entry) => entry.description ?? '').join(',')}
>
  <button type="button" onclick={stepBack}>Undo</button>
  <button type="button" onclick={stepForward}>Redo</button>
  <MapEditor
    {doc}
    {selected}
    {tool}
    width={300}
    height={220}
    onchange={change}
    onselect={(ids: ReadonlySet<string>) => {
      selected = ids;
    }}
    newShape={drawable
      ? (kind: 'polygon' | 'line', at: Point) => {
          drawnCount += 1;
          return blankShape(kind, `drawn-${drawnCount}`, at);
        }
      : undefined}
  />
</div>
