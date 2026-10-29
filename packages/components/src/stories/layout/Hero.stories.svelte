<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Hero from '../../lib/layout/Hero.svelte';
  import LinkButton from '../../lib/ui/LinkButton.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Hero',
    component: Hero,
    parameters: {
      docs: {
        description: {
          component:
            'The top of a landing or "about" page: a named region with a level-1 headline, copy and calls to action. A page with a `Hero` should not also render a `PageHeader` `<h1>`. A background image is decorative, so it sits under an overlay that keeps the text readable.',
        },
      },
    },
  });

  // An inline SVG gradient, so the story needs no network.
  const backdrop =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f6212"/><stop offset="1" stop-color="#a3e635"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>',
    );
</script>

{#snippet calls()}
  <LinkButton href="/plan" tone="primary">Start planning</LinkButton>
  <LinkButton href="/tour" variant="outline">Take the tour</LinkButton>
{/snippet}

<Story name="Centred">
  <Hero title="Grow more with less" description="Plan your beds by the season, and know what to sow next." actions={calls} />
</Story>

<Story name="With a figure">
  <Hero title="Grow more with less" description="Plan your beds by the season, and know what to sow next." actions={calls}>
    {#snippet figure()}
      <div class="bg-base-300 rounded-box flex aspect-video items-center justify-center">
        <span class="text-base-content/70">A plan of the north bed</span>
      </div>
    {/snippet}
  </Hero>
</Story>

<Story name="Background image">
  <Hero
    title="Grow more with less"
    description="Plan your beds by the season, and know what to sow next."
    backgroundImage={backdrop}
    actions={calls}
  />
</Story>
