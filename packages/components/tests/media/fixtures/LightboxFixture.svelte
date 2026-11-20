<!-- Test fixture: a five-image Lightbox with thumbnails and its bound index read back through an output. -->
<script lang="ts">
  import Lightbox from '../../../src/lib/media/Lightbox.svelte';

  interface Props {
    loop?: boolean | undefined;
    dir?: 'ltr' | 'rtl' | undefined;
  }

  let { loop, dir }: Props = $props();
  let index: number | undefined = $state();

  const colours = ['#686', '#864', '#468', '#846', '#684'];
  const names = ['Bed 1', 'Bed 2', 'Bed 3', 'Bed 4', 'Bed 5'];
  const images = colours.map((colour, i) => ({
    src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${colour}"/></svg>`)}`,
    width: 800,
    height: 600,
    alt: `${names[i] ?? ''} in March`,
    caption: i === 2 ? 'Tomatoes staked, first trusses setting.' : undefined,
  }));
</script>

<Lightbox {images} thumbnails bind:index {loop} {dir} aria-label="Garden photos" />
<output data-testid="index">{index ?? 'closed'}</output>
