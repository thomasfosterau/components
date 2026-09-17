<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Citation from '../../lib/citations/Citation.svelte';
  import ReferenceList from '../../lib/citations/ReferenceList.svelte';
  import type { Citation as CitationData } from '../../lib/citations/citation.ts';
  import BibliographyProvider from './BibliographyProvider.svelte';

  const revision: CitationData = {
    id: '0190a8c0-1111-7000-8000-000000000001',
    kind: 'article',
    title: 'A revision of Rosa section Caninae',
    authors: ['Smith, J.', 'Jones, A.'],
    year: 1998,
    container: 'Australian Systematic Botany',
    volume: '11',
    issue: '3',
    pages: '201–248',
    doi: '10.1071/SB97021',
  };
  const flora: CitationData = {
    id: '0190a8c0-1111-7000-8000-000000000002',
    kind: 'book',
    title: 'Flora of New South Wales, volume 2',
    authors: ['Harden, G. J.'],
    year: 1991,
    publisher: 'UNSW Press',
    place: 'Sydney',
  };

  const { Story } = defineMeta({ title: 'Citations/Citation', component: Citation, tags: ['autodocs'] });
</script>

<!-- Each story gets its own `BibliographyProvider`, so the numbering in one
     never leaks into the next. -->
<Story name="Superscript, linked to the reference list">
  <BibliographyProvider>
    {#snippet children()}
      <article class="prose max-w-none">
        <p>
          <em>Rosa canina</em> is circumscribed narrowly here<Citation citation={revision} />, following
          the revision that separated it from <em>R. corymbifera</em><Citation citation={revision} />. The
          New South Wales treatment takes the broader view<Citation citation={flora} />.
        </p>
      </article>
      <ReferenceList />
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Inline format">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content">
        The broader view<Citation citation={flora} format="inline" /> is followed here.
      </p>
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="No reference list on the page">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content">
        A plain, unlinked marker<Citation citation={flora} linkToReference={false} />.
      </p>
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Custom reference label">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content">
        Localised announcement<Citation
          citation={flora}
          referenceLabel={(n, title) => `Voir la référence ${n} : ${title}`}
        />.
      </p>
    {/snippet}
  </BibliographyProvider>
</Story>
