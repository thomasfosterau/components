<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Carousel from '../../lib/media/Carousel.svelte';

  const { Story } = defineMeta({
    title: 'Media/Carousel',
    component: Carousel,
    parameters: {
      docs: {
        description: {
          component:
            'An APG carousel over daisyUI `carousel` and CSS scroll-snap: Previous / Next, slide pickers, swipe, and optional auto-rotation. Under `prefers-reduced-motion: reduce` it never rotates by itself and scrolls without gliding — toggle the OS setting (or emulate it in DevTools) to check.',
        },
      },
    },
  });

  interface Plant {
    readonly name: string;
    readonly note: string;
    readonly surface: string;
  }

  const plants: readonly Plant[] = [
    { name: 'Tomatoes', note: 'Bed 4, planted in October', surface: 'bg-primary text-primary-content' },
    { name: 'Basil', note: 'Between the tomatoes', surface: 'bg-secondary text-secondary-content' },
    { name: 'Beans', note: 'Climbing the north trellis', surface: 'bg-accent text-accent-content' },
    { name: 'Lettuce', note: 'Shade cloth from December', surface: 'bg-neutral text-neutral-content' },
    { name: 'Garlic', note: 'Harvest in late spring', surface: 'bg-base-300 text-base-content' },
  ];
</script>

{#snippet plantSlide(plant: Plant)}
  <div class={['flex h-48 w-full flex-col items-center justify-center gap-1', plant.surface]}>
    <p class="text-2xl font-semibold">{plant.name}</p>
    <p>{plant.note}</p>
  </div>
{/snippet}

<Story name="Default">
  {#snippet template()}
    <Carousel items={plants} label="Plants in Bed 4" slide={plantSlide} />
  {/snippet}
</Story>

<Story name="Auto-rotating">
  {#snippet template()}
    <Carousel items={plants} label="Plants in Bed 4" autoplay={4000} slide={plantSlide} />
  {/snippet}
</Story>

<Story name="Without pickers">
  {#snippet template()}
    <Carousel items={plants} label="Plants in Bed 4" pickers={false} slide={plantSlide} />
  {/snippet}
</Story>
