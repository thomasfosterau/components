<script lang="ts">
  import Carousel from '../../../src/lib/media/Carousel.svelte';

  let index = $state(0);
  const items = ['Photo 1', 'Photo 2'];
</script>

<Carousel {items} label="Photos of Bed 4" bind:index style="width: 300px">
  {#snippet slide(item)}
    <div style="width: 300px; height: 100px">{item}</div>
  {/snippet}
</Carousel>
<output data-testid="index">{index}</output>
<button type="button" onclick={() => (index = 1)}>Jump</button>

<style>
  :global(.carousel) {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }
  :global(.carousel-item) {
    flex: none;
    width: 100%;
    scroll-snap-align: start;
  }
</style>
