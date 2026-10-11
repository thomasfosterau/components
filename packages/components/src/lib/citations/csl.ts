/**
 * The record shapes the CSL-type citation renderers (`BookCitation`,
 * `ChapterCitation`, `ScholarlyArticleCitation`, `ThesisCitation`,
 * `ReportCitation`, `Publisher`) take.
 *
 * Defined HERE, locally, because the bibliographic model they will align with
 * — `@thomasfosterau/biblio`. When it is, these types are
 * expected to become structural subsets of its records (or re-exports of
 * them), so an app maps once, at the seam, from its resource to these shapes.
 * Until then they are deliberately plain: every contributor arm is already
 * RESOLVED (a `Credit` with a name, not a linkage ref), every member is
 * optional except what a reference cannot be written without, and nothing
 * here knows about JSON:API, Effect or any app's resource vocabulary.
 *
 * Names follow Schema.org (`datePublished`, `numberOfPages`, `pageStart`),
 * which is what the renderers emit as microdata.
 *
 * @module
 */

import type { Credit } from './CreditList.svelte';

/** A year, or an instant whose UTC year is the one cited. See `formatting/Year`. */
export type CitationDate = Date | number | string;

/** A publisher (or awarding institution): a Person for a self-published work, usually an Organization. */
export interface PublisherRecord {
  readonly name: string;
  /** The Schema.org type. Default `Organization`. */
  readonly itemtype?: 'Person' | 'Organization' | undefined;
  /** Rendered as a PostalAddress before the name ("Oxford, UK: …"); only present parts. */
  readonly address?:
  | {
    readonly locality?: string | undefined;
    readonly region?: string | undefined;
    readonly country?: string | undefined;
  }
  | undefined;
}

/** The credited contributors a record carries, in credit order. Order is meaning; the renderers never re-sort. */
export interface CreditedRecord {
  readonly authors?: readonly Credit[] | undefined;
  readonly editors?: readonly Credit[] | undefined;
  readonly translators?: readonly Credit[] | undefined;
}

/** A book (CSL `book`). */
export interface BookRecord extends CreditedRecord {
  readonly title?: string | undefined;
  readonly datePublished?: CitationDate | undefined;
  /** The edition as written: `3rd`, `Revised`. */
  readonly edition?: string | undefined;
  readonly numberOfPages?: number | undefined;
  readonly isbn?: string | undefined;
  readonly url?: string | undefined;
  readonly publisher?: PublisherRecord | undefined;
  /** The series it is part of — rendered as a Schema.org BookSeries. */
  readonly series?: { readonly name: string } | undefined;
}

/** A chapter in a book (CSL `chapter`). */
export interface ChapterRecord {
  readonly title?: string | undefined;
  readonly authors?: readonly Credit[] | undefined;
  readonly chapterNumber?: string | number | undefined;
  readonly pageStart?: string | number | undefined;
  readonly pageEnd?: string | number | undefined;
  /** The containing book, when resolved — rendered as a nested `BookCitation`. */
  readonly book?: BookRecord | undefined;
}

/** A journal article (CSL `article-journal`). */
export interface ScholarlyArticleRecord {
  readonly title?: string | undefined;
  readonly authors?: readonly Credit[] | undefined;
  /** Usually the issue's publication year. */
  readonly datePublished?: CitationDate | undefined;
  readonly periodical?:
  | { readonly title?: string | undefined; readonly issn?: string | undefined }
  | undefined;
  readonly volumeNumber?: string | number | undefined;
  readonly issueNumber?: string | number | undefined;
  readonly pageStart?: string | number | undefined;
  readonly pageEnd?: string | number | undefined;
  readonly doi?: string | undefined;
  readonly url?: string | undefined;
}

/** A thesis (CSL `thesis`). */
export interface ThesisRecord {
  readonly title?: string | undefined;
  readonly authors?: readonly Credit[] | undefined;
  readonly datePublished?: CitationDate | undefined;
  /** The degree, as written: `PhD`, `MSc`. */
  readonly degree?: string | undefined;
  /** The awarding institution. */
  readonly institution?: PublisherRecord | undefined;
  readonly url?: string | undefined;
}

/** A report (CSL `report`). */
export interface ReportRecord extends CreditedRecord {
  readonly title?: string | undefined;
  readonly datePublished?: CitationDate | undefined;
  readonly numberOfPages?: number | undefined;
  readonly url?: string | undefined;
  /** Usually the issuing Organization. */
  readonly publisher?: PublisherRecord | undefined;
}
