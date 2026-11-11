<script lang="ts">
  import Carousel from '../../../src/lib/media/Carousel.svelte';

  interface Props {
    autoplay?: number | undefined;
    pickers?: boolean | undefined;
    count?: number | undefined;
  }

  let { autoplay, pickers, count = 5 }: Props = $props();
  let index = $state(0);
  const items = $derived(Array.from({ length: count }, (_, i) => `Photo ${i + 1}`));
</script>

<button type="button">Before the carousel</button>
<Carousel {items} label="Photos of Bed 4" {autoplay} {pickers} bind:index style="width: 300px">
  {#snippet slide(item)}
    <div style="width: 300px; height: 100px"><a href="#{item}">{item}</a></div>
  {/snippet}
</Carousel>
<output data-testid="index">{index}</output>

<style>
  /* The suite loads no Tailwind / daisyUI: the scroll-snap rules daisyUI's
     `carousel` / `carousel-item` would supply, so the strip scrolls sideways. */
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
