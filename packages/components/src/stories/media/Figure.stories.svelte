<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Figure from '../../lib/media/Figure.svelte';

  const { Story } = defineMeta({
    title: 'Media/Figure',
    component: Figure,
    parameters: {
      docs: {
        description: {
          component: 'A `<figure>` with an optional `<figcaption>` — a string or a snippet.',
        },
      },
    },
  });
</script>

<Story name="String caption">
  {#snippet template()}
    <Figure caption="A row of tomato seedlings in early spring">
      <img src="https://placehold.co/400x300" alt="Tomato seedlings" />
    </Figure>
  {/snippet}
</Story>

<Story name="Snippet caption">
  {#snippet template()}
    <Figure>
      {#snippet caption()}
        Photo: <em>Thomas Foster</em>, 2026
      {/snippet}
      <img src="https://placehold.co/400x300" alt="A garden bed" />
    </Figure>
  {/snippet}
</Story>

<Story name="No caption">
  {#snippet template()}
    <Figure>
      <img src="https://placehold.co/400x300" alt="A garden shed" />
    </Figure>
  {/snippet}
</Story>
