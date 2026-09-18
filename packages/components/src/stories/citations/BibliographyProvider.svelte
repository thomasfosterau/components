<!--
  Storybook-only helper: mounts a fresh `BibliographyManager` and, optionally,
  seeds it with citations/footnotes before rendering its children — so a
  story can show `<Citation>`, `<Footnote>`, `<ReferenceList>` and
  `<FootnoteList>` working together without every story repeating the setup.
  Lives outside `src/lib/`, so it never ships in `dist/` (replaces the old
  tree's `BibliographyDemo.svelte`, which did — see the family README).
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import { setupBibliography } from '../../lib/citations/bibliography.svelte.ts';
  import type { Citation, Footnote } from '../../lib/citations/citation.ts';

  interface Props {
    citations?: readonly Citation[];
    footnotes?: readonly (readonly [string, Footnote])[];
    children: Snippet<[]>;
  }

  let { citations = [], footnotes = [], children }: Props = $props();

  const manager = setupBibliography();
  // Seeded once, at mount, from the props' initial values — a story's seed
  // data is not meant to change after render.
  for (const citation of untrack(() => citations)) manager.addCitation(citation);
  for (const [id, footnote] of untrack(() => footnotes)) manager.addFootnote(id, footnote);
</script>

{@render children()}
