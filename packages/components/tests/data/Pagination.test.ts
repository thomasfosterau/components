/**
 * `Pagination`'s contract across both variants: the landmark, `rel` on the
 * arms, `aria-current` on the current page, a disabled arm that is an
 * `aria-disabled` span rather than a dead link, the link form versus the
 * callback form, and the single-page rule.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import Pagination from '../../src/lib/data/Pagination.svelte';
import PaginationInContext from './fixtures/PaginationInContext.svelte';
import { pageHref } from '../../src/lib/data/pagination.ts';

const href = (offset: number): string => pageHref('/contests?q=alb', { offset, limit: 20 });

/** The query a rendered link points at. */
const params = (element: Element): URLSearchParams =>
  new URL(element.getAttribute('href') ?? '', 'http://example.test').searchParams;

test('renders the landmark, the arms and the numbered window', async () => {
  const screen = await render(Pagination, { offset: 40, limit: 20, total: 151, href });

  await expect.element(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();

  const previous = screen.getByRole('link', { name: 'Previous' });
  await expect.element(previous).toHaveAttribute('rel', 'prev');
  expect(params(previous.element()).get('page[offset]')).toBe('20');
  expect(params(previous.element()).get('q')).toBe('alb');

  const next = screen.getByRole('link', { name: 'Next' });
  await expect.element(next).toHaveAttribute('rel', 'next');
  expect(params(next.element()).get('page[offset]')).toBe('60');

  // The window is 1, 2, 3, 4, …, 8 — first, last and one sibling either side.
  expect(params(screen.getByRole('link', { name: 'Page 8' }).element()).get('page[offset]')).toBe(
    '140',
  );
  expect(screen.getByRole('link', { name: 'Page 3' }).elements()).toHaveLength(0);
  expect(screen.getByText('…').element()).toHaveAttribute('aria-hidden', 'true');
});

test('marks the current page instead of linking to where you already are', async () => {
  const screen = await render(Pagination, { offset: 40, limit: 20, total: 151, href });

  const current = screen.getByText('Page 3').element().closest('[aria-current]');
  expect(current).toHaveAttribute('aria-current', 'page');
  expect(current?.tagName).toBe('SPAN');
});

test('the unavailable arm is an aria-disabled span, never a dead link', async () => {
  const screen = await render(Pagination, { offset: 0, limit: 20, total: 151, href });

  expect(screen.getByRole('link', { name: 'Previous' }).elements()).toHaveLength(0);
  const arm = screen.getByText('Previous').element().closest('[aria-disabled]');
  expect(arm).toHaveAttribute('aria-disabled', 'true');
  expect(arm?.tagName).toBe('SPAN');
  expect(arm?.hasAttribute('href')).toBe(false);
});

test('renders nothing when everything fits on one page', async () => {
  const screen = await render(Pagination, { offset: 0, limit: 20, total: 12, href });

  expect(screen.getByRole('navigation').elements()).toHaveLength(0);
});

test('keeps the range line for a single page when showRange asked for it', async () => {
  const screen = await render(Pagination, {
    offset: 0,
    limit: 20,
    total: 12,
    href,
    showRange: true,
    locales: 'en-AU',
  });

  expect(screen.getByRole('navigation').elements()).toHaveLength(0);
  await expect.element(screen.getByText('Showing 1–12 of 12')).toBeInTheDocument();
});

test('formats the range in the caller’s locale, and takes an override', async () => {
  const screen = await render(Pagination, {
    offset: 0,
    limit: 20,
    total: 4310,
    href,
    showRange: true,
    locales: 'en-AU',
  });

  await expect.element(screen.getByText('Showing 1–20 of 4,310')).toBeInTheDocument();

  const overridden = await render(Pagination, {
    offset: 0,
    limit: 20,
    total: 4310,
    href,
    showRange: true,
    rangeLabel: (start, end, total) => `${start}-${end} / ${total}`,
  });
  await expect.element(overridden.getByText('1-20 / 4310')).toBeInTheDocument();
});

test('prevNext renders both arms and a status, even on a single page', async () => {
  const screen = await render(Pagination, {
    offset: 0,
    limit: 20,
    total: 12,
    href,
    variant: 'prevNext',
    statusLabel: (page, pages) => `Page ${page} of ${pages}`,
  });

  await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
  await expect.element(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  expect(screen.getByRole('link').elements()).toHaveLength(0);
  expect(document.querySelectorAll('[aria-disabled="true"]')).toHaveLength(2);
});

test('pages through a callback when there is no href, using real buttons', async () => {
  const onPage = vi.fn();
  const screen = await render(Pagination, { offset: 20, limit: 20, total: 151, onPage });

  expect(screen.getByRole('link').elements()).toHaveLength(0);

  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(onPage).toHaveBeenLastCalledWith(40);

  await userEvent.click(screen.getByRole('button', { name: 'Page 8' }));
  expect(onPage).toHaveBeenLastCalledWith(140);
});

test('names every control, and takes the caller’s words for them', async () => {
  const screen = await render(Pagination, {
    offset: 20,
    limit: 20,
    total: 151,
    href,
    label: 'Result pages',
    previousLabel: 'Précédent',
    nextLabel: 'Suivant',
    pageLabel: (page) => `Page ${page} sur 8`,
  });

  await expect
    .element(screen.getByRole('navigation', { name: 'Result pages' }))
    .toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Précédent' })).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Suivant' })).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Page 1 sur 8' })).toBeInTheDocument();
});

test('resolves every href through the components context', async () => {
  // The fixture's context prefixes a locale segment; the raw `href` callback
  // returns `/p?offset=0`, so the `/en` can only have come from the seam.
  const screen = await render(PaginationInContext);

  await expect
    .element(screen.getByRole('link', { name: 'Previous' }))
    .toHaveAttribute('href', '/en/p?offset=0');
});

test('formatPage writes the visible digits; the accessible name stays pageLabel', async () => {
  const grouped = new Intl.NumberFormat('en-AU');
  const screen = await render(Pagination, {
    offset: 999 * 20,
    limit: 20,
    total: 1001 * 20,
    href,
    formatPage: (page: number) => grouped.format(page),
  });

  const current = screen.getByText('1,000');
  await expect.element(current).toBeInTheDocument();
  await expect.element(screen.getByRole('link', { name: 'Page 1001' })).toHaveTextContent('1,001');
  await expect.element(screen.getByRole('link', { name: 'Page 999' })).toHaveTextContent('999');
});

test('page numbers are bare by default', async () => {
  const screen = await render(Pagination, { offset: 999 * 20, limit: 20, total: 1001 * 20, href });

  await expect.element(screen.getByRole('link', { name: 'Page 1001' })).toHaveTextContent('1001');
});
