<!--
  Fixture for `MapShapeView`, which renders `<g>` and so needs an `<svg>` to
  live in — a component that renders SVG content cannot be mounted straight
  into a `<div>`.
-->
<script lang="ts">
  import MapShapeView from '../../src/lib/MapShapeView.svelte';
  import type { MapShape } from '../../src/lib/shapes.ts';

  interface Props {
    shape: MapShape;
    selected?: boolean;
    editable?: boolean;
  }

  let { shape, selected = false, editable = false }: Props = $props();
</script>

<svg width="300" height="200" role="application" aria-label="Shape under test">
  <MapShapeView {shape} {selected} {editable} />
</svg>
