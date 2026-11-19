# Citations

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

`@thomasfosterau/components/citations`. A page's `Citation` and `Footnote` markers register into a shared `BibliographyManager` (provided by `setupBibliography`); `ReferenceList` and `FootnoteList` render what accumulated. `CreditList` renders a locale-joined byline for one role.

**The CSL-type records are local.** `BookRecord`, `ChapterRecord`, `ScholarlyArticleRecord`, `ThesisRecord`, `ReportRecord`, `PublisherRecord` and `CitationDate` are defined in this package for now, because the bibliographic model they will align with, `@thomasfosterau/biblio`, is not published yet. Contributors are resolved `Credit`s in credit order, not linkage. An app maps its resources onto these shapes at its own seam. The JSON:API `included` resolver belongs to effect-jsonapi's client helpers, not here.

`formatCitation`, `BibliographyManager`, `setupBibliography`, `getBibliographyContext`, and the `CitationData`/`CitationKind`/`FootnoteData`/`Credit` types are also exported. (`Citation` and `Footnote` name the components; the data shapes are `CitationData`/`FootnoteData` to avoid a value/type collision.) `BibliographyManager.citations()` returns `readonly BibliographyEntry[]` — `{ citation: CitationData, order }`, one per distinct source in first-cited order, `order` being the number its markers show. `CreditedRecord` (`{ authors?, editors?, translators? }`, each a `readonly Credit[]` in credit order, never re-sorted) is the contributor shape every CSL record above extends.

```svelte
<script lang="ts">
  import { Citation, Footnote, ReferenceList, FootnoteList, setupBibliography, CreditList } from '@thomasfosterau/components/citations';

  setupBibliography(); // once, high in the page
  const revision = { id: 'revision', kind: 'article', title: 'A revision of Rosa section Caninae', authors: ['Smith, J.'], year: 1998, container: 'Australian Systematic Botany' };
</script>

<p><em>Rosa canina</em> is circumscribed narrowly here<Citation citation={revision} />.</p>
<ReferenceList />

<!-- "Smith, J. and Jones, A." -->
<CreditList role="author" credits={[{ name: 'Smith, J.', href: '/people/smith-j', itemtype: 'Person' }, { name: 'Jones, A.' }]} />
```

A `Citation` or `Footnote` rendered with no `setupBibliography()` provider above it still works — `getBibliographyContext()` falls back to a fresh, standalone manager rather than throwing.
