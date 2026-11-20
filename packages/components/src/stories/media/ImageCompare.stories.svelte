<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ImageCompare from '../../lib/media/ImageCompare.svelte';

  const { Story } = defineMeta({
    title: 'Media/ImageCompare',
    component: ImageCompare,
    parameters: {
      docs: {
        description: {
          component:
            'Two images stacked under a divider that is a real slider: drag it, or focus it and use the arrow, Page, Home and End keys.',
        },
      },
    },
  });
</script>

<Story name="Before and after">
  {#snippet template()}
    <ImageCompare aria-label="Bed 4, March and November" beforeLabel="March" afterLabel="November" class="max-w-xl">
      {#snippet before()}
        <img src="https://placehold.co/600x400/556b2f/fff?text=March" alt="Bed 4 in March, bare soil" class="block w-full" />
      {/snippet}
      {#snippet after()}
        <img src="https://placehold.co/600x400/8b4513/fff?text=November" alt="Bed 4 in November, after harvest" class="block w-full" />
      {/snippet}
    </ImageCompare>
  {/snippet}
</Story>

<Story name="Custom value text">
  {#snippet template()}
    <ImageCompare
      aria-label="Plan against the built bed"
      value={30}
      sliderLabel="Plan or built"
      valueText={(v) => `${v}% of the plan showing`}
      class="max-w-xl"
    >
      {#snippet before()}
        <img src="https://placehold.co/600x400/1e3a5f/fff?text=Plan" alt="The plan for Bed 4" class="block w-full" />
      {/snippet}
      {#snippet after()}
        <img src="https://placehold.co/600x400/2f4f4f/fff?text=Built" alt="Bed 4 as built" class="block w-full" />
      {/snippet}
    </ImageCompare>
  {/snippet}
</Story>
