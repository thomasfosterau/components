<!-- A Toaster with a descendant that pushes into it: `getToaster()` has to run
     during a child's init, which a `.ts` test has no way to arrange. -->
<script lang="ts">
  import Toaster from '../../../src/lib/feedback/Toaster.svelte';
  import type { ToastPosition } from '../../../src/lib/feedback/sizes.ts';
  import ToasterPusher from './ToasterPusher.svelte';

  interface Props {
    position?: ToastPosition | undefined;
    regionLabel?: string | undefined;
    dismissLabel?: string | undefined;
    durationMs?: number | undefined;
    toastDurationMs?: number | undefined;
  }

  let { position, regionLabel, dismissLabel, durationMs, toastDurationMs }: Props = $props();
</script>

<Toaster {position} {regionLabel} {dismissLabel} {durationMs}>
  <ToasterPusher durationMs={toastDurationMs} />
</Toaster>
