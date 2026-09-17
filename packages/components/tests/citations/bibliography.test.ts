import { expect, test } from 'vitest';
import { BibliographyManager } from '../../src/lib/citations/bibliography.svelte.ts';
import type { Citation } from '../../src/lib/citations/citation.ts';

const article: Citation = {
  id: '0190a8c0-1111-7000-8000-000000000001',
  kind: 'article',
  title: 'A revision of Rosa section Caninae',
};

test('gives a source ONE number however often it is cited', () => {
  const manager = new BibliographyManager();
  expect(manager.addCitation(article)).toBe(1);
  expect(manager.addCitation(article)).toBe(1);
  expect(manager.citations()).toHaveLength(1);
});

test('numbers distinct sources in citation order', () => {
  const manager = new BibliographyManager();
  const second = { ...article, id: 'second' };
  expect(manager.addCitation(article)).toBe(1);
  expect(manager.addCitation(second)).toBe(2);
  // Citing the first again does not renumber the second.
  expect(manager.addCitation(article)).toBe(1);
  expect(manager.citations().map((entry) => entry.order)).toEqual([1, 2]);
});

test('dedupes footnotes by key and keeps registration order', () => {
  const manager = new BibliographyManager();
  manager.addFootnote('a', { content: 'First' });
  manager.addFootnote('b', { content: 'Second' });
  manager.addFootnote('a', { content: 'First, corrected' });
  const footnotes = manager.footnotes();
  expect(footnotes.map(([id]) => id)).toEqual(['a', 'b']);
  expect(footnotes[0]?.[1]?.content).toBe('First, corrected');
});
