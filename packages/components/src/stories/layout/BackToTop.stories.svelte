<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BackToTop from '../../lib/layout/BackToTop.svelte';
  import Main from '../../lib/layout/Main.svelte';

  const { Story } = defineMeta({
    title: 'Layout/BackToTop',
    component: BackToTop,
    parameters: {
      docs: {
        description: {
          component:
            'A "Back to top" link that appears once the reader has scrolled past `threshold`, and takes them — and the focus — back to the top, so the next Tab continues from there. `inline` is GOV.UK\'s sticky link at the end of the content column; `floating` is a fixed corner button. Scroll the story down to see it appear.',
        },
      },
    },
  });

  const paragraphs = Array.from({ length: 24 }, (_, index) => index + 1);
</script>

<Story name="Inline, at the end of a long account">
  <Main class="max-w-prose space-y-4">
    <h1 class="text-3xl font-semibold">Rosa canina</h1>
    <a class="link" href="#habitat">Habitat</a>
    {#each paragraphs as paragraph (paragraph)}
      <p class="leading-7">
        Paragraph {paragraph}. The dog rose is a climbing wild rose native to Europe, north-west
        Africa and western Asia, found in hedgerows, scrub and woodland edges.
      </p>
    {/each}
    <BackToTop threshold={400} />
  </Main>
</Story>

<Story name="Floating, stacked above a floating action button">
  <Main class="max-w-prose space-y-4" style="--back-to-top-offset: 4.5rem;">
    <h1 class="text-3xl font-semibold">Bed 4</h1>
    {#each paragraphs as paragraph (paragraph)}
      <p class="leading-7">Planting note {paragraph}.</p>
    {/each}
    <BackToTop variant="floating" threshold={400} />
    <button type="button" class="btn btn-primary btn-circle fixed end-4 bottom-4 z-40">
      <span aria-hidden="true">+</span>
      <span class="sr-only">Add a planting</span>
    </button>
  </Main>
</Story>
