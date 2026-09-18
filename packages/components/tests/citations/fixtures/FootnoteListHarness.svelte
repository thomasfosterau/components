<!--
  Test fixture: seeds a fresh `BibliographyManager` with the given footnotes
  and renders `<FootnoteList>` against it — the counterpart of
  `ReferenceListHarness.svelte`. See that file's header for why the list
  props are forwarded conditionally rather than always.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import FootnoteList from '../../../src/lib/citations/FootnoteList.svelte';
  import { setupBibliography } from '../../../src/lib/citations/bibliography.svelte.ts';
  import type { Footnote } from '../../../src/lib/citations/citation.ts';

  interface Props {
    footnotes: readonly (readonly [string, Footnote])[];
    title?: string;
    showTitle?: boolean;
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  let { footnotes, title, showTitle, headingLevel }: Props = $props();

  const manager = setupBibliography();
  // Seeded once, at mount, from the prop's initial value — see
  // `ReferenceListHarness.svelte`.
  for (const [id, footnote] of untrack(() => footnotes)) manager.addFootnote(id, footnote);

  const listProps = $derived({
    ...(title !== undefined && { title }),
    ...(showTitle !== undefined && { showTitle }),
    ...(headingLevel !== undefined && { headingLevel }),
  });
</script>

<FootnoteList {...listProps} />
