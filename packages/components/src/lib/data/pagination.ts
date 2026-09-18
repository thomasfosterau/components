/**
 * Offset / limit pagination arithmetic, and the href that carries it.
 *
 * Pure functions, deliberately: the window a pager renders (first page, last
 * page, the current page's neighbours, the gaps between them) is arithmetic
 * with a dozen edge cases — an offset past the end, a zero limit, a total of
 * zero — and arithmetic is far cheaper to pin in a unit test than in a
 * rendered component. `Pagination` is then markup over {@link pageWindow}.
 *
 * Ported from an Effect implementation with `Option` replaced by
 * `undefined` and the query Schema left behind in the app that needs it:
 * decoding an app's own URL is the app's job, and a component library that
 * owned it would drag a validation library onto every consumer's page.
 *
 * @module
 */

/** The JSON:API offset query parameter — the default {@link pageHref} writes. */
export const PAGE_OFFSET_PARAM = 'page[offset]';
/** The JSON:API limit query parameter — the default {@link pageHref} writes. */
export const PAGE_LIMIT_PARAM = 'page[limit]';

/** A resolved page position. */
export interface Page {
  readonly offset: number;
  readonly limit: number;
}

/** The query-parameter names {@link pageHref} writes the position into. */
export interface PageParamNames {
  readonly offset?: string | undefined;
  readonly limit?: string | undefined;
}

/**
 * Build the href for `page` from `base` (a path, optionally with a query
 * string and a fragment).
 *
 * Every other query parameter is preserved and the page parameters are
 * replaced — paging through a filtered list that silently dropped the filter
 * is the bug this shape exists to prevent. A relative `base` yields a
 * relative href: the absolute origin below is a parsing scaffold, never part
 * of the result.
 */
export function pageHref(base: string, page: Page, names: PageParamNames = {}): string {
  const url = new URL(base, 'http://pagination.invalid');
  url.searchParams.set(names.offset ?? PAGE_OFFSET_PARAM, String(page.offset));
  url.searchParams.set(names.limit ?? PAGE_LIMIT_PARAM, String(page.limit));
  return `${url.pathname}${url.search}${url.hash}`;
}

/** One entry in a rendered page window: a page link, or the gap before one. */
export type PageWindowItem =
  | {
      readonly kind: 'page';
      /** 1-based page number, as rendered. */
      readonly page: number;
      /** The offset that page starts at. */
      readonly offset: number;
      readonly current: boolean;
    }
  | { readonly kind: 'gap'; /** The page number the gap follows. */ readonly after: number };

/** Everything a pager needs to draw itself, from one position and a total. */
export interface PageWindow {
  /** 1-based current page. */
  readonly page: number;
  /** Total pages; at least 1, even with no rows. */
  readonly pageCount: number;
  /** 1-based index of the first row shown, or 0 when there are no rows. */
  readonly from: number;
  /** 1-based index of the last row shown, or 0 when there are no rows. */
  readonly to: number;
  /** Offset of the previous page, or `undefined` on the first. */
  readonly previous: number | undefined;
  /** Offset of the next page, or `undefined` on the last. */
  readonly next: number | undefined;
  /** First page, last page, and `siblings` pages either side of the current. */
  readonly items: readonly PageWindowItem[];
}

/**
 * Compute the window of page links to render around `page`: the first and
 * last pages always, plus `siblings` pages either side of the current one,
 * with a gap marker wherever the sequence skips.
 *
 * Tolerant by construction — a zero or negative limit, a negative offset and
 * an offset past the end all resolve to a real page rather than throwing,
 * because every one of them arrives from a hand-edited URL sooner or later
 * and a 500 is a worse answer than the first page.
 */
export function pageWindow(page: Page, total: number, siblings = 1): PageWindow {
  const limit = Math.max(1, Math.floor(page.limit));
  const offset = Math.max(0, Math.floor(page.offset));
  const rows = Math.max(0, total);
  const pageCount = Math.max(1, Math.ceil(rows / limit));
  const current = Math.min(pageCount, Math.floor(offset / limit) + 1);

  const wanted: number[] = [];
  const want = (n: number): void => {
    if (n >= 1 && n <= pageCount && !wanted.includes(n)) wanted.push(n);
  };
  want(1);
  for (let n = current - siblings; n <= current + siblings; n += 1) want(n);
  want(pageCount);
  wanted.sort((left, right) => left - right);

  const items: PageWindowItem[] = [];
  for (const [index, n] of wanted.entries()) {
    const previous = index > 0 ? wanted[index - 1] : undefined;
    if (previous !== undefined && n - previous > 1) items.push({ kind: 'gap', after: previous });
    items.push({ kind: 'page', page: n, offset: (n - 1) * limit, current: n === current });
  }

  return {
    page: current,
    pageCount,
    from: rows > 0 ? (current - 1) * limit + 1 : 0,
    to: rows > 0 ? Math.min(rows, current * limit) : 0,
    previous: current > 1 ? (current - 2) * limit : undefined,
    next: current < pageCount ? current * limit : undefined,
    items,
  };
}
