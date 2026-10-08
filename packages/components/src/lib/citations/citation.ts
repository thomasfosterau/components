/**
 * The citation vocabulary and its formatter.
 *
 * The shape a `Citation` carries is deliberately not any particular app's
 * publication model: this package is app-agnostic and presentational, and a
 * component that imported a models package would put the whole model layer
 * into every consumer's bundle for the sake of a title and a year. The app
 * maps its resource onto this shape at its own seam, which is also what lets
 * a Storybook story or a test render one from a literal.
 *
 * ## Why the formatter is a pure function here
 *
 * Formatting inside the component recomputes on every re-render and cannot
 * be tested without mounting a component. Pulling it out fixes both — the
 * caller can memoise, the list derives once — and a citation style is a pile
 * of conditional punctuation, which is exactly the kind of code that is
 * wrong in the fourth branch and never noticed by eye.
 *
 * The style is a compact author–date one. It is not CSL: a full CSL
 * implementation is a dependency and a style-file pipeline, and most
 * consumers need one readable rendering rather than eleven switchable ones.
 *
 * @module
 */

/** The kinds a citation renders differently. */
export type CitationKind =
  | 'article'
  | 'book'
  | 'chapter'
  | 'thesis'
  | 'report'
  | 'conference'
  | 'web'
  | 'dataset'
  | 'software'
  | 'media'
  | 'periodical';

/**
 * One bibliography entry, as a presentational component needs it.
 *
 * Every field beyond `id` / `kind` / `title` is optional, because every one of
 * them is missing from some real citation: a thesis has no journal, a
 * mononymous eighteenth-century author has no given name, and grey literature
 * routinely has no year.
 */
export interface Citation {
  /** The publication's node id — also the anchor `#ref-<id>` links to. */
  readonly id: string;
  readonly kind: CitationKind;
  readonly title: string;
  /** Author display names, already ordered by the byline's own ordinal. */
  readonly authors?: readonly string[] | undefined;
  /** Publication year, as printed. */
  readonly year?: number | undefined;
  /** The serial an article appeared in, or the book a chapter is from. */
  readonly container?: string | undefined;
  readonly volume?: string | undefined;
  readonly issue?: string | undefined;
  /** Page span, already assembled (`"12–34"`). */
  readonly pages?: string | undefined;
  readonly publisher?: string | undefined;
  readonly place?: string | undefined;
  readonly url?: string | undefined;
  readonly doi?: string | undefined;
  /** When the citing author read a web source. */
  readonly accessed?: Date | undefined;
}

/** A footnote — tracked separately from citations. */
export interface Footnote {
  /** The note's text. */
  readonly content: string;
  /** A custom marker (`*`, `†`) instead of the auto-assigned number. */
  readonly symbol?: string | undefined;
}

// Absence is the empty string throughout the helpers below, not `T | undefined`.
// Every one of them feeds a join whose contract is already "skip the empty
// parts", so a missing clause genuinely IS "print nothing here".

/**
 * The author phrase a compact style prints: one name, two joined by `&`, or
 * the first followed by `et al.` A four-author paper printed in full is what
 * makes a reference list unreadable, and the full byline is on the
 * publication's own page.
 */
const authorPhrase = (authors: readonly string[]): string => {
  const [first, second] = authors;
  if (first === undefined) return '';
  if (authors.length === 1) return first;
  if (authors.length === 2) return `${first} & ${second}`;
  return `${first} et al.`;
};

/** Join the non-empty parts of a clause with `separator`. */
const joinPresent = (parts: readonly string[], separator: string): string =>
  parts.filter((part) => part !== '').join(separator);

// The detail clause is the one part of a citation that differs by kind, and
// the eleven kinds collapse into FIVE shapes. Each shape is its own function
// below rather than an arm of one switch: the arms do not share a line of
// logic, and a single switch over eleven labels with a nested ternary in
// three of them is the shape that is wrong in the fourth branch and never
// noticed by eye.

/** A serial's clause: container, volume(issue), pages. Articles, journals, conference papers. */
const serialClause = (citation: Citation): string => {
  if (citation.container === undefined) return '';
  const volume =
    citation.volume === undefined
      ? ''
      : citation.issue === undefined
        ? `, ${citation.volume}`
        : `, ${citation.volume}(${citation.issue})`;
  const pages = citation.pages === undefined ? '' : `, ${citation.pages}`;
  return `${citation.container}${volume}${pages}`;
};

/** A chapter's clause: the volume it is in, and where in it. */
const chapterClause = (citation: Citation): string =>
  joinPresent(
    [
      citation.container === undefined ? '' : `In: ${citation.container}`,
      citation.pages === undefined ? '' : `pp. ${citation.pages}`,
    ],
    ', ',
  );

/**
 * An imprint clause: `place: publisher` when both are known, whichever one is
 * known alone otherwise — the shape every compact style prints for a book, a
 * thesis or a report.
 */
const imprintClause = (citation: Citation): string =>
  joinPresent([citation.place ?? '', citation.publisher ?? ''], ': ');

/**
 * A web source's clause. The access date is the whole point of citing one: it
 * says which version of a mutable page the claim rests on.
 */
const webClause = (citation: Citation): string => {
  if (citation.url === undefined) return '';
  const accessed =
    citation.accessed === undefined
      ? ''
      : ` (accessed ${citation.accessed.toISOString().slice(0, 10)})`;
  return `Available at: ${citation.url}${accessed}`;
};

/** A hosted artefact's clause: whichever of publisher / repository is known. */
const hostClause = (citation: Citation): string => citation.publisher ?? citation.container ?? '';

/** Kind → the shape its detail clause takes. Exhaustive over {@link CitationKind}. */
const DETAIL_CLAUSES: Readonly<Record<CitationKind, (citation: Citation) => string>> = {
  article: serialClause,
  periodical: serialClause,
  conference: serialClause,
  chapter: chapterClause,
  book: imprintClause,
  thesis: imprintClause,
  report: imprintClause,
  web: webClause,
  dataset: hostClause,
  software: hostClause,
  media: hostClause,
};

/** The publication-detail clause for a citation's kind. */
const detailClause = (citation: Citation): string => DETAIL_CLAUSES[citation.kind](citation);

/**
 * Render a citation as one formatted string.
 *
 * Pure and total: every branch is reachable from real data and none throws on
 * a citation carrying nothing but a title, which is a state the corpus can
 * genuinely be in (an ingested reference awaiting enrichment).
 */
export const formatCitation = (citation: Citation): string => {
  const parts = joinPresent(
    [
      citation.authors === undefined ? '' : authorPhrase(citation.authors),
      citation.year === undefined ? '' : `(${citation.year})`,
      `“${citation.title}”`,
      detailClause(citation),
      citation.doi === undefined ? '' : `DOI: ${citation.doi}`,
    ],
    '. ',
  );
  return `${parts}.`;
};
