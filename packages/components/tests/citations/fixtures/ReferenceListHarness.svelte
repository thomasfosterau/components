<!--
  Test fixture: seeds a fresh `BibliographyManager` with the given citations
  and renders `<ReferenceList>` against it. `ReferenceList` reads its
  bibliography from context, so a test needs a real provider mounted — this
  is that provider, with none of the prose a real page would add around it.

  `title` / `showTitle` / `headingLevel` are forwarded only when the test
  actually supplies them, rather than always passed (possibly `undefined`) —
  `exactOptionalPropertyTypes` treats an explicit `undefined` as a different
  thing from the key being absent, and a test omitting one of these means to
  exercise `ReferenceList`'s OWN default, not overwrite it with `undefined`.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import ReferenceList from '../../../src/lib/citations/ReferenceList.svelte';
  import { setupBibliography } from '../../../src/lib/citations/bibliography.svelte.ts';
  import type { Citation } from '../../../src/lib/citations/citation.ts';

  interface Props {
    citations: readonly Citation[];
    title?: string;
    showTitle?: boolean;
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  let { citations, title, showTitle, headingLevel }: Props = $props();

  const manager = setupBibliography();
  // Seeded once, at mount, from the prop's initial value — a fixture's
  // `citations` list is not meant to change after render.
  for (const citation of untrack(() => citations)) manager.addCitation(citation);

  const listProps = $derived({
    ...(title !== undefined && { title }),
    ...(showTitle !== undefined && { showTitle }),
    ...(headingLevel !== undefined && { headingLevel }),
  });
</script>

<ReferenceList {...listProps} />
