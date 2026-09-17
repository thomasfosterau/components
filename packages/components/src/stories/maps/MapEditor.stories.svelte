<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    emptyHistory,
    recordEdit,
    redo,
    undo,
    type History,
  } from '../../lib/canvas/history.ts';
  import type { Point, VectorDocument, Viewport } from '../../lib/canvas/types.ts';
  import MapEditor from '../../lib/maps/MapEditor.svelte';
  import { blankShape, type MapEdit, type MapShape } from '../../lib/maps/shapes.ts';

  const area = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    label: string,
  ): MapShape => ({
    id,
    type: 'polygon',
    position: { x, y },
    rotation: 0,
    zIndex: Number(id),
    strokeColor: 'var(--color-base-300)',
    strokeWidth: 1.5,
    fillColor: fill,
    opacity: 0.8,
    locked: false,
    label,
    points: [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  });

  const point = (id: string, x: number, y: number, label: string): MapShape => ({
    id,
    type: 'marker',
    position: { x, y },
    rotation: 0,
    zIndex: 10 + Number(id),
    strokeColor: 'var(--color-base-100)',
    strokeWidth: 1.5,
    fillColor: 'var(--color-chart-1)',
    opacity: 1,
    locked: false,
    label,
    radius: 7,
  });

  const base: VectorDocument<MapShape> = {
    version: '1',
    metadata: {},
    viewport: { offsetX: 40, offsetY: 40, zoom: 1 },
    grid: { visible: true, size: 20, snap: true, color: 'var(--color-base-300)' },
    elements: [
      area('1', 0, 0, 160, 100, 'var(--color-chart-1)', 'Bed 1'),
      area('2', 220, 40, 120, 160, 'var(--color-chart-2)', 'Bed 2'),
      area('3', 0, 140, 180, 80, 'var(--color-chart-3)', 'Bed 3'),
      point('4', 60, 50, 'Tomato'),
      point('5', 280, 120, 'Garlic'),
    ],
  };

  const TOOLS = [
    { id: 'select', label: 'Select' },
    { id: 'draw-polygon', label: 'Draw area' },
    { id: 'draw-line', label: 'Draw path' },
    { id: 'pan', label: 'Pan' },
  ] as const;

  const { Story } = defineMeta({
    title: 'Maps/MapEditor',
    component: MapEditor,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component:
            'A plan-drawing surface. It keeps no document and no history: it reports each edit and the page decides. The toolbar, the undo stack and the shape defaults below are the PAGE’s, and wiring them here is how an application wires them.',
        },
      },
    },
  });
</script>

<script lang="ts">
  // The editor reports changes; the page owns the document AND its history.
  // The one line that matters is recording on `committed` alone, so that one
  // drag is one undo rather than one per pointer move.
  let doc = $state<VectorDocument<MapShape>>(base);
  let selected = $state<ReadonlySet<string>>(new Set<string>());
  let history = $state<History<MapShape>>(emptyHistory());
  let tool = $state<'select' | 'pan' | 'draw-polygon' | 'draw-line'>('select');
  let drawn = $state(0);

  const change = (next: VectorDocument<MapShape>, edit: MapEdit): void => {
    doc = next;
    if (edit.committed) history = recordEdit(history, edit.transform, edit.transform.type);
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

  /**
   * The page's defaults for a new shape — the thing `MapEditor` will not decide
   * for itself. A real one would take the project's palette; this takes the
   * next chart colour.
   */
  const newShape = (kind: 'polygon' | 'line', at: Point): MapShape => {
    drawn += 1;
    return {
      ...blankShape(kind, `drawn-${drawn}`, at),
      zIndex: 20 + drawn,
      strokeColor: 'var(--color-base-content)',
      strokeWidth: 1.5,
      fillColor: kind === 'polygon' ? 'var(--color-chart-4)' : 'none',
      opacity: 0.8,
      label: kind === 'polygon' ? `Area ${drawn}` : `Path ${drawn}`,
    };
  };
</script>

<Story name="Select and drag">
  <div class="space-y-2">
    <p class="text-base-content/70 text-sm">
      Click an area to select it, drag to move it. Positions snap to the 20-unit grid.
    </p>
    <MapEditor
      {doc}
      {selected}
      width={640}
      height={360}
      onchange={change}
      onselect={(ids: ReadonlySet<string>) => {
        selected = ids;
      }}
      onviewportchange={(viewport: Viewport) => {
        doc = { ...doc, viewport };
      }}
    />
  </div>
</Story>

<Story name="Reshape, draw and undo">
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <div class="join" role="group" aria-label="Tool">
        {#each TOOLS as option (option.id)}
          <button
            type="button"
            class="join-item btn btn-sm"
            class:btn-active={tool === option.id}
            aria-pressed={tool === option.id}
            onclick={() => {
              tool = option.id;
            }}
          >
            {option.label}
          </button>
        {/each}
      </div>
      <div class="join">
        <button
          type="button"
          class="join-item btn btn-sm"
          disabled={history.past.length === 0}
          onclick={stepBack}
        >
          Undo
        </button>
        <button
          type="button"
          class="join-item btn btn-sm"
          disabled={history.future.length === 0}
          onclick={stepForward}
        >
          Redo
        </button>
      </div>
      <span class="text-base-content/70 text-sm">{history.past.length} steps back</span>
    </div>
    <p class="text-base-content/70 text-sm">
      Select an area to get its grips: drag a corner to move it, drag a dashed midpoint to add one,
      Alt-click a corner to remove it. With a drawing tool in hand, click to place each corner and
      double-click — or click the first corner again — to finish.
    </p>
    <MapEditor
      {doc}
      {selected}
      {tool}
      {newShape}
      width={640}
      height={360}
      onchange={change}
      onselect={(ids: ReadonlySet<string>) => {
        selected = ids;
      }}
      onviewportchange={(viewport: Viewport) => {
        doc = { ...doc, viewport };
      }}
    />
  </div>
</Story>

<Story name="Panning">
  <MapEditor doc={base} tool="pan" width={640} height={360} label="Site plan, pan tool" />
</Story>
