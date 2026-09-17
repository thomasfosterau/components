<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FootnoteList from '../../lib/citations/FootnoteList.svelte';
  import type { Footnote } from '../../lib/citations/citation.ts';
  import BibliographyProvider from './BibliographyProvider.svelte';

  const footnotes: readonly (readonly [string, Footnote])[] = [
    ['sheets', { content: 'Chiefly at NSW and CANB; the annotations were never reconciled.' }],
    ['range', { content: 'The northern limit is disputed.', symbol: '†' }],
  ];

  const { Story } = defineMeta({
    title: 'Citations/FootnoteList',
    component: FootnoteList,
    tags: ['autodocs'],
  });
</script>

<Story name="Two notes, one with a custom symbol">
  <BibliographyProvider {footnotes}>
    {#snippet children()}
      <FootnoteList />
    {/snippet}
  </BibliographyProvider>
</Story>

<Story name="Custom title and heading level">
  <BibliographyProvider {footnotes}>
    {#snippet children()}
      <FootnoteList title="Endnotes" headingLevel={3} />
    {/snippet}
  </BibliographyProvider>
</Story>
