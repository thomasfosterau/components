<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ReferenceList from '../../lib/citations/ReferenceList.svelte';
  import type { Citation } from '../../lib/citations/citation.ts';
  import BibliographyProvider from './BibliographyProvider.svelte';

  const revision: Citation = {
    id: 'revision',
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
  const flora: Citation = {
    id: 'flora',
    kind: 'book',
    title: 'Flora of New South Wales, volume 2',
    authors: ['Harden, G. J.'],
    year: 1991,
    publisher: 'UNSW Press',
    place: 'Sydney',
  };

  const { Story } = defineMeta({
    title: 'Citations/ReferenceList',
    component: ReferenceList,
    tags: ['autodocs'],
  });
</script>

<Story name="Two sources">
  <BibliographyProvider citations={[revision, flora]}>
    {#snippet children()}
      <ReferenceList />
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Custom title and heading level">
  <BibliographyProvider citations={[revision, flora]}>
    {#snippet children()}
      <ReferenceList title="Works cited" headingLevel={3} />
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Heading suppressed">
  <BibliographyProvider citations={[revision, flora]}>
    {#snippet children()}
      <ReferenceList showTitle={false} />
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Nothing cited — renders nothing">
  <BibliographyProvider>
    {#snippet children()}
      <p class="text-base-content/70 text-sm">Nothing renders below — that is the story.</p>
      <ReferenceList />
    {/snippet}
  </BibliographyProvider>
</Story>
