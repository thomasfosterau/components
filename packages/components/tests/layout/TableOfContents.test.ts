import { page } from 'vite-plus/test/browser';
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import TableOfContents from '../../src/lib/layout/TableOfContents.svelte';
import { nestEntries } from '../../src/lib/layout/table-of-contents.ts';
import TableOfContentsFixture from './fixtures/TableOfContentsFixture.svelte';

beforeEach(async () => {
  await page.viewport(1280, 800);
});

afterEach(async () => {
  vi.restoreAllMocks();
  window.scrollTo(0, 0);
});

test('collects the headings into a nav with nested lists by level', async () => {
  const screen = await render(TableOfContentsFixture);

  const nav = screen.getByRole('navigation', { name: 'On this page' });
  await expect.element(nav.getByRole('link', { name: 'Section 2a' })).toBeInTheDocument();
  const top = nav.element().querySelector(':scope > ol');
  expect(top?.querySelectorAll(':scope > li')).toHaveLength(3);
  const nested = nav.getByRole('link', { name: 'Section 2a' }).element().closest('ol');
  expect(nested?.parentElement?.closest('li')?.querySelector('a')?.textContent?.trim()).toBe(
    'Section 2',
  );
  expect(nav.getByRole('link', { name: 'Section 1' }).element().getAttribute('href')).toBe(
    '#section-1',
  );
  expect(nav.getByRole('link', { name: 'Too deep' }).elements()).toHaveLength(0);
});

test('the section scrolled into view is aria-current="location", and only it', async () => {
  const screen = await render(TableOfContentsFixture);
  const nav = screen.getByRole('navigation', { name: 'On this page' });
  await expect.element(nav.getByRole('link', { name: 'Section 3' })).toBeInTheDocument();

  document.getElementById('section-3')?.scrollIntoView({ block: 'start' });

  await expect
    .element(nav.getByRole('link', { name: 'Section 3' }))
    .toHaveAttribute('aria-current', 'location');
  for (const name of ['Section 1', 'Section 2', 'Section 2a']) {
    expect(nav.getByRole('link', { name }).element().hasAttribute('aria-current')).toBe(false);
  }
});

test('a click focuses the heading and replaces the hash without a history entry', async () => {
  const screen = await render(TableOfContentsFixture);
  const before = history.length;

  await screen.getByRole('link', { name: 'Section 2', exact: true }).click();

  await expect
    .element(screen.getByRole('heading', { name: 'Section 2', exact: true }))
    .toHaveFocus();
  expect(location.hash).toBe('#section-2');
  expect(history.length).toBe(before);
  history.replaceState(history.state, '', location.pathname + location.search);
});

test('under reduced motion the jump does not smooth-scroll', async () => {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = original(query);
    if (!query.includes('prefers-reduced-motion')) return list;
    return Object.defineProperty(list, 'matches', { value: true });
  });
  const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
  const screen = await render(TableOfContentsFixture);

  await screen.getByRole('link', { name: 'Section 3' }).click();

  expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  history.replaceState(history.state, '', location.pathname + location.search);
});

test('on a narrow screen it is a closed disclosure that opens to the links', async () => {
  await page.viewport(390, 844);
  const screen = await render(TableOfContentsFixture);

  const nav = screen.getByRole('navigation', { name: 'On this page' });
  const summary = nav.getByText('On this page');
  await expect.element(summary).toBeInTheDocument();
  expect(nav.element().querySelector('details')?.open).toBe(false);
  await summary.click();
  await expect.element(nav.getByRole('link', { name: 'Section 1' })).toBeVisible();
});

test('explicit entries need no container', async () => {
  const screen = await render(TableOfContents, {
    label: 'Contents',
    entries: [
      { id: 'sowing', label: 'Sowing', level: 2 },
      { id: 'thinning', label: 'Thinning', level: 3 },
    ],
  });

  const nav = screen.getByRole('navigation', { name: 'Contents' });
  await expect
    .element(nav.getByRole('link', { name: 'Thinning' }))
    .toHaveAttribute('href', '#thinning');
});

test('nestEntries nests a skipped level one step', () => {
  const tree = nestEntries([
    { id: 'a', label: 'A', level: 2 },
    { id: 'b', label: 'B', level: 4 },
    { id: 'c', label: 'C', level: 3 },
    { id: 'd', label: 'D', level: 2 },
  ]);

  expect(tree.map((node) => node.id)).toEqual(['a', 'd']);
  expect(tree[0]?.children.map((node) => node.id)).toEqual(['b', 'c']);
});
