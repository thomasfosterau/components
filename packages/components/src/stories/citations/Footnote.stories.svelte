<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Footnote from '../../lib/citations/Footnote.svelte';
  import FootnoteList from '../../lib/citations/FootnoteList.svelte';
  import BibliographyProvider from './BibliographyProvider.svelte';

  const { Story } = defineMeta({ title: 'Citations/Footnote', component: Footnote, tags: ['autodocs'] });
</script>

<Story name="Numbered, with its list">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content">
        Herbarium sheets from the 1980s carry both names<Footnote
          id="sheets"
          content="Chiefly at NSW and CANB; the annotations were never reconciled."
        />.
      </p>
      <FootnoteList />
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Custom symbol">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content">
        A note that stands apart from the numbering<Footnote id="aside" content="See also." symbol="†" />.
      </p>
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Custom accessible label">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content">
        Localised announcement<Footnote
          id="localised"
          content="See also."
          footnoteLabel={(marker, content) => `Remarque ${marker} : ${content}`}
        />.
      </p>
    {/snippet}
  </BibliographyProvider>
</Story>
