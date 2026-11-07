<!-- A ListDetailLayout whose selection the test flips, as a route change would. -->
<script lang="ts">
  import ListDetailLayout from '../../../src/lib/layout/ListDetailLayout.svelte';

  interface Props {
    showDetail?: boolean;
  }

  let { showDetail = $bindable(false) }: Props = $props();
</script>

<ListDetailLayout {showDetail} backHref="/beds" focusTarget="bed-4">
  {#snippet list()}
    <ul>
      <li><a id="bed-4" href="/beds/4">Bed 4</a></li>
    </ul>
  {/snippet}
  {#snippet detail()}<h2>Bed 4</h2>{/snippet}
  {#snippet placeholder()}<p>Choose a bed.</p>{/snippet}
</ListDetailLayout>
<button type="button" onclick={() => (showDetail = !showDetail)}>Toggle</button>
