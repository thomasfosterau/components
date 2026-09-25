/**
 * `@thomasfosterau/components/citations` — a separate entry point so it never sits on
 * the always-loaded path of a consumer that does not use it.
 *
 * A page's `<Citation>` and `<Footnote>` markers register into a shared
 * `BibliographyManager` (provided by `setupBibliography`); `<ReferenceList>`
 * and `<FootnoteList>` render what accumulated. `<CreditList>` renders a
 * locale-joined byline for one role (authors, editors, translators, or a
 * caller's own). `formatCitation` is the pure formatter the lists use, and
 * `DOILink` / `ISBNLink` / `ISSNLink` render the three identifiers a
 * citation commonly carries as resolvable links.
 *
 * @module
 */

export {
  BibliographyManager,
  getBibliographyContext,
  setupBibliography,
  type BibliographyEntry,
} from './bibliography.svelte.ts';
// The two data shapes are re-exported under `*Data` names: `Citation` and
// `Footnote` are already taken by the components below, and a module cannot
// export a type and a Svelte component under one identifier (the
// component's binding is a value in the same declaration space).
export {
  formatCitation,
  type Citation as CitationData,
  type CitationKind,
  type Footnote as FootnoteData,
} from './citation.ts';
export { default as Citation } from './Citation.svelte';
export { default as CreditList, type Credit } from './CreditList.svelte';
export { default as DOILink } from './DOILink.svelte';
export { default as Footnote } from './Footnote.svelte';
export { default as FootnoteList } from './FootnoteList.svelte';
export { default as ISBNLink } from './ISBNLink.svelte';
export { default as ISSNLink } from './ISSNLink.svelte';
export { default as ReferenceList } from './ReferenceList.svelte';
// The CSL-type renderers, over the local record shapes in `./csl.ts` (which
// will align with `@thomasfosterau/biblio` once that is published).
export { default as BookCitation } from './BookCitation.svelte';
export { default as ChapterCitation } from './ChapterCitation.svelte';
export { default as ScholarlyArticleCitation } from './ScholarlyArticleCitation.svelte';
export { default as ThesisCitation } from './ThesisCitation.svelte';
export { default as ReportCitation } from './ReportCitation.svelte';
export { default as Publisher } from './Publisher.svelte';
export type {
  BookRecord,
  ChapterRecord,
  CitationDate,
  CreditedRecord,
  PublisherRecord,
  ReportRecord,
  ScholarlyArticleRecord,
  ThesisRecord,
} from './csl.ts';
