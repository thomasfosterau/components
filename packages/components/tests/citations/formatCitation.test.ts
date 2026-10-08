/**
 * `formatCitation` is a pile of conditional punctuation — the code shape that
 * is wrong in the fourth branch and never noticed by eye — so every kind's
 * detail clause gets a case, including the degenerate one (a citation with
 * nothing but a title, which is a state an ingested-but-unenriched reference
 * genuinely reaches).
 */
import { expect, test } from 'vite-plus/test';
import { formatCitation, type Citation } from '../../src/lib/citations/citation.ts';

const article: Citation = {
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

/**
 * A consumer's own record, whose optional fields are themselves
 * `T | undefined`, mapped field-for-field into a `Citation`. Under
 * `exactOptionalPropertyTypes` this only type-checks while `Citation` declares
 * those fields `T | undefined` (#76); `vp run check` is that assertion.
 */
interface StoredReference {
  readonly id: string;
  readonly title: string;
  readonly authors?: readonly string[] | undefined;
  readonly year?: number | undefined;
  readonly container?: string | undefined;
  readonly doi?: string | undefined;
}

const toCitation = (reference: StoredReference): Citation => ({
  id: reference.id,
  kind: 'article',
  title: reference.title,
  authors: reference.authors,
  year: reference.year,
  container: reference.container,
  doi: reference.doi,
});

test('reads a field forwarded as `undefined` as absent', () => {
  const bare: Citation = { id: article.id, kind: 'article', title: article.title };
  expect(formatCitation(toCitation({ id: article.id, title: article.title }))).toBe(
    formatCitation(bare),
  );
});

test('renders an article with its serial, volume, issue, pages and DOI', () => {
  expect(formatCitation(article)).toBe(
    'Smith, J. & Jones, A.. (1998). “A revision of Rosa section Caninae”. ' +
      'Australian Systematic Botany, 11(3), 201–248. DOI: 10.1071/SB97021.',
  );
});

test('abbreviates three or more authors to the first plus et al.', () => {
  const many = { ...article, authors: ['Smith, J.', 'Jones, A.', 'Nguyen, T.'] };
  expect(formatCitation(many)).toContain('Smith, J. et al.');
});

test('keeps a single author unabbreviated', () => {
  expect(formatCitation({ ...article, authors: ['Linnaeus, C.'] })).toContain('Linnaeus, C.');
});

test('drops the volume parenthesis when there is no issue', () => {
  const { issue: _issue, ...noIssue } = article;
  expect(formatCitation(noIssue)).toContain('Australian Systematic Botany, 11, 201–248');
});

test('renders a book as place: publisher', () => {
  const book: Citation = {
    id: 'b',
    kind: 'book',
    title: 'Flora of New South Wales',
    publisher: 'UNSW Press',
    place: 'Sydney',
    year: 1990,
  };
  expect(formatCitation(book)).toContain('Sydney: UNSW Press');
});

test('renders a book with a publisher but no place as the publisher alone', () => {
  const book: Citation = { id: 'b', kind: 'book', title: 'Flora', publisher: 'UNSW Press' };
  expect(formatCitation(book)).toContain('UNSW Press');
  expect(formatCitation(book)).not.toContain(':');
});

test('renders a chapter as In: <book>, pp. <pages>', () => {
  const chapter: Citation = {
    id: 'c',
    kind: 'chapter',
    title: 'Rosaceae',
    container: 'Flora of Australia, volume 8',
    pages: '11–40',
  };
  expect(formatCitation(chapter)).toContain('In: Flora of Australia, volume 8, pp. 11–40');
});

test('renders a web source with its URL and access date', () => {
  const web: Citation = {
    id: 'w',
    kind: 'web',
    title: 'Rosa canina profile',
    url: 'https://example.org/rosa-canina',
    accessed: new Date('2026-03-14T09:00:00Z'),
  };
  expect(formatCitation(web)).toContain(
    'Available at: https://example.org/rosa-canina (accessed 2026-03-14)',
  );
});

test('renders a periodical and a conference paper like an article', () => {
  const shape = { container: 'Muelleria', volume: '40', pages: '1–12' } as const;
  expect(formatCitation({ id: 'p', kind: 'periodical', title: 'Muelleria', ...shape })).toContain(
    'Muelleria, 40, 1–12',
  );
  expect(formatCitation({ id: 'c', kind: 'conference', title: 'A talk', ...shape })).toContain(
    'Muelleria, 40, 1–12',
  );
});

test('renders a thesis and a report like a book — place: publisher', () => {
  const shape = { place: 'Armidale', publisher: 'University of New England' } as const;
  expect(formatCitation({ id: 't', kind: 'thesis', title: 'A thesis', ...shape })).toContain(
    'Armidale: University of New England',
  );
  expect(formatCitation({ id: 'r', kind: 'report', title: 'A report', ...shape })).toContain(
    'Armidale: University of New England',
  );
});

test('renders a dataset, software and media citation from its publisher or container', () => {
  expect(
    formatCitation({ id: 'd', kind: 'dataset', title: 'Occurrences', publisher: 'GBIF' }),
  ).toContain('GBIF');
  expect(
    formatCitation({ id: 's', kind: 'software', title: 'vegan', container: 'CRAN' }),
  ).toContain('CRAN');
  expect(formatCitation({ id: 'm', kind: 'media', title: 'A film', publisher: 'ABC' })).toContain(
    'ABC',
  );
});

test('renders a chapter with only a book, and only pages, and neither', () => {
  expect(
    formatCitation({ id: 'c', kind: 'chapter', title: 'Rosaceae', container: 'Flora' }),
  ).toContain('In: Flora');
  expect(formatCitation({ id: 'c', kind: 'chapter', title: 'Rosaceae', pages: '11–40' })).toContain(
    'pp. 11–40',
  );
  expect(formatCitation({ id: 'c', kind: 'chapter', title: 'Rosaceae' })).toBe('“Rosaceae”.');
});

test('renders a web source with no access date', () => {
  expect(
    formatCitation({ id: 'w', kind: 'web', title: 'A page', url: 'https://example.org' }),
  ).toContain('Available at: https://example.org.');
});

test('omits the detail clause entirely when its inputs are missing', () => {
  expect(formatCitation({ id: 'a', kind: 'article', title: 'Orphaned' })).toBe('“Orphaned”.');
  expect(formatCitation({ id: 'w', kind: 'web', title: 'Orphaned' })).toBe('“Orphaned”.');
});

test('survives a citation carrying nothing but a title', () => {
  expect(formatCitation({ id: 'x', kind: 'report', title: 'Untitled survey' })).toBe(
    '“Untitled survey”.',
  );
});
