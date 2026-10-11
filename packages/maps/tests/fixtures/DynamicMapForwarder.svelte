<!--
  Fixture: a wrapper that declares its own optional props and forwards every
  one of them to `DynamicMap` unconditionally, the way an application
  component built on this package does. Under `exactOptionalPropertyTypes` an
  omitted prop arrives here as an explicit `undefined`, so this file only
  type-checks while `DynamicMap` declares each forwarded prop `T | undefined`
  (#45). `vp run check` is the assertion; the browser test that renders it
  pins that the forwarded `undefined` still falls back to `DynamicMap`'s own
  defaults.
-->
<script lang="ts">
  import DynamicMap from '../../src/lib/DynamicMap.svelte';
  import type { MapCamera, MapStyle } from '../../src/lib/types.ts';

  interface Props {
    accessToken: string;
    style: MapStyle;
    camera: MapCamera;
    height?: number | undefined;
    label?: string | undefined;
    panHintLabel?: string | undefined;
    unavailableLabel?: string | undefined;
  }

  let { accessToken, style, camera, height, label, panHintLabel, unavailableLabel }: Props =
    $props();
</script>

<DynamicMap {accessToken} {style} {camera} {height} {label} {panHintLabel} {unavailableLabel} />
