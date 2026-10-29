<!-- A Drawer opened from a real Button, with an Apply action that closes it. -->
<script lang="ts">
  import './drawer.css';
  import Drawer from '../../../src/lib/feedback/Drawer.svelte';
  import Button from '../../../src/lib/ui/Button.svelte';
  import type { DrawerSide } from '../../../src/lib/feedback/sizes.ts';

  interface Props {
    side?: DrawerSide | undefined;
    hideTitle?: boolean | undefined;
  }

  let { side, hideTitle }: Props = $props();
  let open = $state(false);
</script>

<Drawer bind:open title="Filters" description="Narrow the plant list." {side} {hideTitle} size="sm">
  {#snippet trigger({ props })}<Button {...props}>Filters</Button>{/snippet}
  <label class="block">Colour <input name="colour" /></label>
  <label class="block">Height <input name="height" /></label>
  {#snippet actions({ close })}<Button onclick={close}>Apply</Button>{/snippet}
</Drawer>
<p data-testid="open">{open}</p>
