<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Main from '../../lib/layout/Main.svelte';
  import Navbar from '../../lib/layout/Navbar.svelte';
  import PageHeader from '../../lib/layout/PageHeader.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Scroll behaviours',
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            '`Navbar` `scrollBehavior` (`pinned`, `hide-on-scroll`) and `elevateOnScroll`, and `PageHeader` `scrollBehavior="collapse"`. Scroll the canvas. Under `prefers-reduced-motion` the compact title switches at halfway instead of fading, and a hide-on-scroll bar stays pinned.',
        },
      },
    },
  });

  const paragraphs = Array.from({ length: 24 }, (_, index) => index + 1);
</script>

{#snippet brand()}<a href="/" rel="home" class="btn btn-ghost text-lg">Garden</a>{/snippet}

{#snippet body()}
  {#each paragraphs as paragraph (paragraph)}
    <p class="max-w-prose">
      Bed {paragraph}: broad beans sown in autumn, netted against birds, watered twice a week
      until they flower, then left to the bees.
    </p>
  {/each}
{/snippet}

<Story name="Large title collapses">
  {#snippet template()}
    <Navbar scrollBehavior="pinned" start={brand} />
    <Main class="mx-auto max-w-3xl space-y-4 p-6">
      <PageHeader
        title="Tomato ‘Black Krim’"
        subtitle="Solanum lycopersicum"
        collapsedTitle="Black Krim"
        scrollBehavior="collapse"
      />
      {@render body()}
    </Main>
  {/snippet}
</Story>

<Story name="Hide on scroll">
  {#snippet template()}
    <Navbar scrollBehavior="hide-on-scroll" start={brand} />
    <Main class="mx-auto max-w-3xl space-y-4 p-6">
      <PageHeader title="Observations" />
      {@render body()}
    </Main>
  {/snippet}
</Story>

<Story name="Elevate on scroll">
  {#snippet template()}
    <Navbar scrollBehavior="pinned" elevateOnScroll start={brand} />
    <Main class="mx-auto max-w-3xl space-y-4 p-6">
      <PageHeader title="Beds" />
      {@render body()}
    </Main>
  {/snippet}
</Story>
