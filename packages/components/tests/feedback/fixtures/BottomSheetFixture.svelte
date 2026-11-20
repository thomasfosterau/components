<!-- A BottomSheet over a page with its own button, echoing the bound `open`
     and `detent` so a test can read both. -->
<script lang="ts">
  import BottomSheet from '../../../src/lib/feedback/BottomSheet.svelte';
  import type { SheetDetent } from '../../../src/lib/feedback/sizes.ts';

  interface Props {
    open?: boolean | undefined;
    modal?: boolean | undefined;
    interactiveBelow?: number | undefined;
    dismissible?: boolean | undefined;
    detents?: readonly SheetDetent[] | undefined;
    detentLabels?: readonly string[] | undefined;
    rows?: number | undefined;
  }

  let { open = true, modal, interactiveBelow, dismissible, detents, detentLabels, rows = 3 }: Props = $props();

  // svelte-ignore state_referenced_locally
  let shown = $state(open);
  let detent = $state(0);
  let behind = $state(0);
</script>

<button type="button" onclick={() => (behind += 1)}>Behind the sheet</button>
<p data-testid="behind">{behind}</p>
<p data-testid="open">{shown}</p>
<p data-testid="detent">{detent}</p>

<BottomSheet
  bind:open={shown}
  bind:detent
  title="Results"
  description="Beds near you."
  {modal}
  {interactiveBelow}
  {dismissible}
  {detents}
  {detentLabels}
  data-testid="sheet"
>
  <ul>
    {#each { length: rows }, row (row)}
      <li style="height: 40px">Bed {row + 1}</li>
    {/each}
  </ul>
</BottomSheet>
