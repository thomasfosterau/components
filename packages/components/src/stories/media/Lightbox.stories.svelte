<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Lightbox from '../../lib/media/Lightbox.svelte';

  const { Story } = defineMeta({
    title: 'Media/Lightbox',
    component: Lightbox,
    parameters: {
      docs: {
        description: {
          component:
            'A full-screen image viewer on bits-ui’s `Dialog`. ←/→ move, Home/End go to the ends, +/− zoom and 0 resets; while zoomed the arrows pan and Escape resets before it closes. Pinch, Ctrl+wheel, double-click, swipe and swipe-down-to-close each have a button.',
        },
      },
    },
  });

  const photo = (colour: string, text: string): string =>
    `https://placehold.co/1200x800/${colour}/fff?text=${encodeURIComponent(text)}`;

  const beds = [
    { src: photo('556b2f', 'Bed 1'), width: 1200, height: 800, alt: 'Bed 1, garlic coming up', caption: 'Garlic, three weeks after planting.' },
    { src: photo('8b4513', 'Bed 2'), width: 1200, height: 800, alt: 'Bed 2, freshly dug' },
    { src: photo('2f4f4f', 'Bed 3'), width: 1200, height: 800, alt: 'Bed 3, tomatoes staked', caption: 'Tomatoes staked, first trusses setting.' },
    { src: photo('6b8e23', 'Bed 4'), width: 1200, height: 800, alt: 'Bed 4, beans on the trellis' },
  ];
</script>

<Story name="Gallery with thumbnails">
  {#snippet template()}
    <Lightbox images={beds} thumbnails aria-label="Garden beds" />
  {/snippet}
</Story>

<Story name="Single image">
  {#snippet template()}
    <Lightbox images={beds.slice(2, 3)} thumbnails aria-label="Bed 3" />
  {/snippet}
</Story>

<Story name="Looping">
  {#snippet template()}
    <Lightbox images={beds} thumbnails loop aria-label="Garden beds" />
  {/snippet}
</Story>

<Story name="Right to left">
  {#snippet template()}
    <div dir="rtl">
      <Lightbox images={beds} thumbnails dir="rtl" aria-label="Garden beds" />
    </div>
  {/snippet}
</Story>
