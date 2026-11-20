<!-- A ListDetailLayout whose selection the test flips, as a route change would,
     with the bound `listSize` echoed for the resizable tests. -->
<script lang="ts">
  import ListDetailLayout from '../../../src/lib/layout/ListDetailLayout.svelte';

  interface Props {
    showDetail?: boolean;
    resizable?: boolean | undefined;
    listSize?: number | undefined;
    onListResize?: ((size: number) => void) | undefined;
  }

  let { showDetail = $bindable(false), resizable, listSize = $bindable(undefined), onListResize }: Props = $props();
</script>

<ListDetailLayout
  {showDetail}
  backHref="/beds"
  focusTarget="bed-4"
  {resizable}
  bind:listSize
  {onListResize}
>
  {#snippet list()}
    <ul>
      <li><a id="bed-4" href="/beds/4">Bed 4</a></li>
    </ul>
  {/snippet}
  {#snippet detail()}<h2>Bed 4</h2>{/snippet}
  {#snippet placeholder()}<p>Choose a bed.</p>{/snippet}
</ListDetailLayout>
<button type="button" onclick={() => (showDetail = !showDetail)}>Toggle</button>
<p data-testid="list-size">{listSize ?? 'unset'}</p>
