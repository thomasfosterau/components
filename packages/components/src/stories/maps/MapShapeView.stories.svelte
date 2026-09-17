<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MapShapeView from '../../lib/maps/MapShapeView.svelte';
  import type { MapShape } from '../../lib/maps/shapes.ts';

  const base = {
    rotation: 0,
    zIndex: 0,
    strokeColor: 'var(--color-base-300)',
    strokeWidth: 1.5,
    opacity: 1,
    locked: false,
  } as const;

  const area: MapShape = {
    ...base,
    id: 'area',
    type: 'polygon',
    position: { x: 40, y: 40 },
    fillColor: 'var(--color-chart-1)',
    label: 'Bed 1',
    points: [
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 140, y: 60 },
      { x: 0, y: 80 },
    ],
  };

  const point: MapShape = {
    ...base,
    id: 'point',
    type: 'marker',
    position: { x: 260, y: 80 },
    fillColor: 'var(--color-chart-2)',
    strokeColor: 'var(--color-base-100)',
    label: 'Tomato',
    radius: 9,
  };

  const path: MapShape = {
    ...base,
    id: 'path',
    type: 'line',
    position: { x: 40, y: 140 },
    fillColor: 'none',
    strokeColor: 'var(--color-base-content)',
    label: 'Path',
    points: [
      { x: 0, y: 0 },
      { x: 90, y: -20 },
      { x: 180, y: 10 },
      { x: 260, y: -30 },
    ],
  };

  const { Story } = defineMeta({
    title: 'Maps/MapShapeView',
    component: MapShapeView,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component:
            'How one area, path or point is drawn. It renders `<g>`, so every story wraps it in an `<svg>` — which is also how `MapEditor` uses it.',
        },
      },
    },
  });
</script>

<Story name="An area, a path and a point">
  <svg viewBox="0 0 340 180" class="bg-base-100 h-auto w-full max-w-lg">
    <MapShapeView shape={area} />
    <MapShapeView shape={path} />
    <MapShapeView shape={point} />
  </svg>
</Story>

<!-- Selected in a surface that cannot reshape it — a plan on a detail page.
     The rings are indicators, not grips: a handle that looks draggable and is
     not is worse than no handle. -->
<Story name="Selected, read-only">
  <svg viewBox="0 0 340 160" class="bg-base-100 h-auto w-full max-w-lg">
    <MapShapeView shape={area} selected />
    <MapShapeView shape={point} selected />
  </svg>
</Story>

<!-- Selected in an editor. The same rule, read the other way: these vertices
     CAN be dragged, so they are filled grips, and each edge offers a dashed
     midpoint a new vertex is dragged out of. -->
<Story name="Selected, editable">
  <svg viewBox="0 0 340 180" class="bg-base-100 h-auto w-full max-w-lg">
    <MapShapeView shape={area} selected editable />
    <MapShapeView shape={path} selected editable />
  </svg>
</Story>

<Story name="Rotated">
  <svg viewBox="0 0 340 200" class="bg-base-100 h-auto w-full max-w-lg">
    <MapShapeView shape={{ ...area, rotation: 20 }} />
  </svg>
</Story>
