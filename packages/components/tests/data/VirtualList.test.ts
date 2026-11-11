/**
 * `VirtualList` against a real 400 px scroll container: the window stays
 * small, every row states its position in the whole, focus survives
 * scrolling, measured rows tile without overlapping, and the end-reached and
 * scroll-to calls fire when and where they say.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { VirtualListApi } from '../../src/lib/data/virtual.svelte.ts';
import VirtualListFixture from './fixtures/VirtualListFixture.svelte';

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: index, height: 40 }));

function scrollerOf(screen: Awaited<ReturnType<typeof render>>): HTMLElement {
  const element = screen.getByTestId('scroller').element();
  if (!(element instanceof HTMLElement)) throw new Error('no scroller');
  return element;
}

/** Scroll to `top` and let the window re-render. */
async function scrollTo(scroller: HTMLElement, top: number): Promise<void> {
  scroller.scrollTop = top;
  scroller.dispatchEvent(new Event('scroll'));
  await frame();
  await frame();
}

function positions(
  screen: Awaited<ReturnType<typeof render>>,
  role: 'listitem' | 'article',
): number[] {
  return screen
    .getByRole(role)
    .elements()
    .map((element) => Number(element.getAttribute('aria-posinset')));
}

async function apiOf(screen: Awaited<ReturnType<typeof render>>, ready: Promise<VirtualListApi>) {
  await expect.element(screen.getByRole('list')).toBeInTheDocument();
  return ready;
}

test('10,000 rows mount fewer than 60 elements, each stating its place in the whole', async () => {
  const screen = await render(VirtualListFixture);

  await expect.element(screen.getByRole('list', { name: 'Observations' })).toBeInTheDocument();
  expect(screen.getByRole('listitem').elements().length).toBeLessThan(60);
  expect(screen.getByRole('listitem').elements()[0]).toHaveAttribute('aria-setsize', '10000');

  // Fixed 40 px rows: the middle of the list is at 5,000 × 40.
  await scrollTo(scrollerOf(screen), 5000 * 40);
  await expect.poll(() => positions(screen, 'listitem')).toContain(5001);
  const visible = positions(screen, 'listitem');
  expect(visible.length).toBeLessThan(60);
  expect(Math.min(...visible)).toBeGreaterThan(4980);
  expect(Math.max(...visible)).toBeLessThan(5030);
  for (const element of screen.getByRole('listitem').elements()) {
    expect(element).toHaveAttribute('aria-setsize', '10000');
  }
});

test('the spacers are hidden and carry no role', async () => {
  const screen = await render(VirtualListFixture);
  await scrollTo(scrollerOf(screen), 2000 * 40);
  await expect.poll(() => positions(screen, 'listitem')).toContain(2001);

  const list = screen.getByRole('list').element();
  const spacers = [...list.children].filter((child) => !child.hasAttribute('data-index'));
  expect(spacers).toHaveLength(2);
  for (const spacer of spacers) {
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(spacer).not.toHaveAttribute('role');
  }
});

test('the focused row stays mounted and focused when scrolled far away', async () => {
  const screen = await render(VirtualListFixture);
  const scroller = scrollerOf(screen);

  const tenth = screen.getByRole('link', { name: 'Observation 10', exact: true });
  await expect.element(tenth).toBeInTheDocument();
  tenth.element().focus();
  await scrollTo(scroller, 8000 * 40);
  await expect.poll(() => positions(screen, 'listitem')).toContain(8001);

  // Still in the DOM, in index order before the window, and still focused.
  await expect.element(tenth).toBeInTheDocument();
  expect(document.activeElement).toBe(tenth.element());
  expect(document.activeElement).not.toBe(document.body);
  expect(positions(screen, 'listitem')[0]).toBe(10);

  // Once focus leaves, the row is released.
  tenth.element().blur();
  await scrollTo(scroller, 8000 * 40 + 1);
  await expect.element(tenth).not.toBeInTheDocument();
});

/** Every rendered row's box, in DOM order. */
function boxesOf(
  screen: Awaited<ReturnType<typeof render>>,
): { top: number; bottom: number; height: number }[] {
  return screen
    .getByRole('listitem')
    .elements()
    .map((element) => element.getBoundingClientRect());
}

/** Keep scrolling to the bottom until row `position` sits inside the scroller. */
async function scrollToEnd(scroller: HTMLElement, position: number, attempts = 30): Promise<void> {
  await scrollTo(scroller, scroller.scrollHeight);
  const lastRow = scroller.querySelector(`[aria-posinset="${position}"]`);
  const inView =
    lastRow !== null &&
    lastRow.getBoundingClientRect().bottom <= scroller.getBoundingClientRect().bottom + 1;
  if (!inView && attempts > 1) await scrollToEnd(scroller, position, attempts - 1);
}

test('measured rows tile without overlapping, and the end of the list is reachable', async () => {
  const screen = await render(VirtualListFixture, { count: 500, measure: true });
  const scroller = scrollerOf(screen);

  await expect.element(screen.getByRole('list')).toBeInTheDocument();
  await frame();
  await frame();
  const boxes = boxesOf(screen);
  const [first, second] = boxes;
  for (const [index, box] of boxes.slice(1).entries()) {
    expect(box.top).toBeGreaterThanOrEqual((boxes[index]?.bottom ?? 0) - 0.5);
  }
  // Each row is its content's height, not the 40 px estimate.
  expect(first?.height).toBeCloseTo(20, 0);
  expect(second?.height).toBeCloseTo(30, 0);

  await scrollToEnd(scroller, 500);
  const last = screen.getByRole('link', { name: 'Observation 500', exact: true });
  await expect.element(last).toBeInTheDocument();
  expect(last.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
    scroller.getBoundingClientRect().bottom + 1,
  );
});

test('onEndReached fires once per approach to the end, not per scroll event', async () => {
  const onEndReached = vi.fn<() => void>();
  const screen = await render(VirtualListFixture, { items: rows(200), onEndReached });
  const scroller = scrollerOf(screen);
  await expect.element(screen.getByRole('list')).toBeInTheDocument();
  expect(onEndReached).not.toHaveBeenCalled();

  await scrollTo(scroller, 200 * 40);
  await scrollTo(scroller, 200 * 40 - 10);
  await scrollTo(scroller, 200 * 40);
  await expect.poll(() => onEndReached.mock.calls.length).toBe(1);
  await frame();
  expect(onEndReached).toHaveBeenCalledTimes(1);

  // A new page arrives; reaching its end is a new approach.
  await screen.rerender({ items: rows(400), onEndReached });
  await scrollTo(scroller, 400 * 40);
  await expect.poll(() => onEndReached.mock.calls.length).toBe(2);
});

test('onEndReached waits while busy and stops once total rows are loaded', async () => {
  const onEndReached = vi.fn<() => void>();
  const fifty = rows(50);
  const screen = await render(VirtualListFixture, { items: fifty, total: 50, onEndReached });
  await scrollTo(scrollerOf(screen), 50 * 40);
  await frame();
  expect(onEndReached).not.toHaveBeenCalled();

  await screen.rerender({ items: fifty, total: 100, busy: true, onEndReached });
  await frame();
  expect(onEndReached).not.toHaveBeenCalled();
  await screen.rerender({ items: fifty, total: 100, busy: false, onEndReached });
  await expect.poll(() => onEndReached.mock.calls.length).toBe(1);
  expect(screen.getByRole('listitem').elements()[0]).toHaveAttribute('aria-setsize', '100');
});

test('api.scrollToIndex(7500, { align: "start" }) puts row 7500 at the top', async () => {
  const { promise, resolve } = Promise.withResolvers<VirtualListApi>();
  const screen = await render(VirtualListFixture, { onApi: resolve });
  const api = await apiOf(screen, promise);
  const scroller = scrollerOf(screen);

  await api.scrollToIndex(7500, { align: 'start' });
  const row = screen.getByRole('link', { name: 'Observation 7501', exact: true });
  await expect.element(row).toBeInTheDocument();
  const top = row.element().closest('[role="listitem"]')?.getBoundingClientRect().top ?? 0;
  expect(top).toBeCloseTo(scroller.getBoundingClientRect().top, 0);
  // Focus moves only when asked.
  expect(document.activeElement).toBe(document.body);

  await api.scrollToKey(20, { align: 'start', focus: true });
  const focused = screen.getByRole('link', { name: 'Observation 21', exact: true });
  await expect.element(focused).toBeInTheDocument();
  expect(document.activeElement).toBe(focused.element().closest('[role="listitem"]'));
});

test('scrollToIndex lands on a measured row too', async () => {
  const { promise, resolve } = Promise.withResolvers<VirtualListApi>();
  const screen = await render(VirtualListFixture, { count: 2000, measure: true, onApi: resolve });
  const api = await apiOf(screen, promise);
  const scroller = scrollerOf(screen);

  await api.scrollToIndex(1500, { align: 'start' });
  const row = screen.getByRole('link', { name: 'Observation 1501', exact: true });
  await expect.element(row).toBeInTheDocument();
  const top = row.element().closest('[role="listitem"]')?.getBoundingClientRect().top ?? 0;
  expect(Math.abs(top - scroller.getBoundingClientRect().top)).toBeLessThan(2);
});

test('feed mode: articles, aria-busy, and Page Down / Page Up between articles', async () => {
  const screen = await render(VirtualListFixture, {
    semantics: 'feed',
    busy: true,
    label: 'Recent',
  });

  const feed = screen.getByRole('feed', { name: 'Recent' });
  await expect.element(feed).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('list').elements()).toHaveLength(0);
  const first = screen.getByRole('article').first();
  await expect.element(first).toHaveAttribute('aria-posinset', '1');
  await expect.element(first).toHaveAttribute('tabindex', '-1');

  screen.getByRole('link', { name: 'Observation 1', exact: true }).element().focus();
  await userEvent.keyboard('{PageDown}');
  await expect.poll(() => document.activeElement?.getAttribute('aria-posinset')).toBe('2');
  await userEvent.keyboard('{PageDown}');
  await expect.poll(() => document.activeElement?.getAttribute('aria-posinset')).toBe('3');
  await userEvent.keyboard('{PageUp}');
  await expect.poll(() => document.activeElement?.getAttribute('aria-posinset')).toBe('2');

  // Past the window's edge, the next article is scrolled into existence first.
  for (let step = 0; step < 30; step += 1) await userEvent.keyboard('{PageDown}');
  await expect.poll(() => document.activeElement?.getAttribute('aria-posinset')).toBe('32');

  await screen.rerender({ semantics: 'feed', busy: false, label: 'Recent' });
  await expect.element(feed).toHaveAttribute('aria-busy', 'false');
});

test('feed mode: Ctrl+End / Ctrl+Home leave the feed, whichever rows are rendered', async () => {
  const screen = await render(VirtualListFixture, {
    semantics: 'feed',
    label: 'Recent',
    surround: true,
  });

  // From the first article, the 10,000th is not in the DOM; the escape does not need it.
  screen.getByRole('link', { name: 'Observation 1', exact: true }).element().focus();
  await userEvent.keyboard('{Control>}{End}{/Control}');
  await expect.element(screen.getByRole('button', { name: 'After the feed' })).toHaveFocus();

  screen.getByRole('link', { name: 'Observation 1', exact: true }).element().focus();
  await userEvent.keyboard('{Control>}{Home}{/Control}');
  await expect.element(screen.getByRole('button', { name: 'Before the feed' })).toHaveFocus();
});
