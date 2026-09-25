/**
 * The pure pagination arithmetic: the window a pager renders, and the href
 * that carries a position. Both are edge cases all the way down — an offset
 * past the end, a zero limit, an empty result — which is exactly why they are
 * functions rather than derivations inside the component.
 */

import { expect, test } from 'vite-plus/test';
import {
  PAGE_LIMIT_PARAM,
  PAGE_OFFSET_PARAM,
  pageHref,
  pageWindow,
} from '../../src/lib/data/pagination.ts';

test('windows a middle page with first, last, siblings and a gap', () => {
  const view = pageWindow({ offset: 40, limit: 20 }, 151);

  expect(view.page).toBe(3);
  expect(view.pageCount).toBe(8);
  expect(view.from).toBe(41);
  expect(view.to).toBe(60);
  expect(view.previous).toBe(20);
  expect(view.next).toBe(60);
  expect(view.items).toEqual([
    { kind: 'page', page: 1, offset: 0, current: false },
    { kind: 'page', page: 2, offset: 20, current: false },
    { kind: 'page', page: 3, offset: 40, current: true },
    { kind: 'page', page: 4, offset: 60, current: false },
    { kind: 'gap', after: 4 },
    { kind: 'page', page: 8, offset: 140, current: false },
  ]);
});

test('has no previous on the first page and no next on the last', () => {
  const first = pageWindow({ offset: 0, limit: 20 }, 151);
  expect(first.previous).toBeUndefined();
  expect(first.next).toBe(20);

  const last = pageWindow({ offset: 140, limit: 20 }, 151);
  expect(last.page).toBe(8);
  expect(last.to).toBe(151);
  expect(last.next).toBeUndefined();
  expect(last.items.at(1)).toEqual({ kind: 'gap', after: 1 });
});

test('collapses to one page with no rows, and reports an empty range', () => {
  const empty = pageWindow({ offset: 0, limit: 20 }, 0);

  expect(empty).toMatchObject({ page: 1, pageCount: 1, from: 0, to: 0 });
  expect(empty.items).toEqual([{ kind: 'page', page: 1, offset: 0, current: true }]);
});

test('clamps an offset past the end, and widens with siblings', () => {
  const view = pageWindow({ offset: 10_000, limit: 20 }, 100, 2);

  expect(view.page).toBe(5);
  expect(view.items.map((item) => (item.kind === 'page' ? item.page : '…'))).toEqual([
    1,
    '…',
    3,
    4,
    5,
  ]);
});

test('tolerates a zero limit and a negative offset rather than throwing', () => {
  const view = pageWindow({ offset: -5, limit: 0 }, 3);

  expect(view.pageCount).toBe(3);
  expect(view.page).toBe(1);
});

test('writes the page parameters and keeps the rest of the query and the hash', () => {
  const href = pageHref('/contests?q=alb&page[offset]=0#results', { offset: 40, limit: 20 });
  const url = new URL(href, 'http://example.test');

  expect(href.startsWith('/contests')).toBe(true);
  expect(url.pathname).toBe('/contests');
  expect(url.searchParams.get('q')).toBe('alb');
  expect(url.searchParams.get(PAGE_OFFSET_PARAM)).toBe('40');
  expect(url.searchParams.get(PAGE_LIMIT_PARAM)).toBe('20');
  expect(url.hash).toBe('#results');
});

test('writes the caller’s own parameter names when given', () => {
  const href = pageHref('/plants', { offset: 60, limit: 30 }, { offset: 'from', limit: 'per' });
  const url = new URL(href, 'http://example.test');

  expect(url.searchParams.get('from')).toBe('60');
  expect(url.searchParams.get('per')).toBe('30');
});
