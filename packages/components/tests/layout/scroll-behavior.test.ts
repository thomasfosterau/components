/**
 * The scroll behaviours of `Navbar` and `PageHeader`: a pinned bar's
 * elevation and scroll padding, a hide-on-scroll bar that comes back on
 * focus and stays put under reduced motion, and a collapsing title that
 * keeps one heading in the tree without shifting layout.
 */

import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { collapseProgress, nextHidden } from '../../src/lib/layout/scroll-behavior.ts';
import ScrollChromeFixture from './fixtures/ScrollChromeFixture.svelte';

afterEach(() => {
  vi.restoreAllMocks();
  window.scrollTo({ top: 0, behavior: 'instant' });
});

/** Make `prefers-reduced-motion: reduce` match for this test. */
const reduceMotion = (): void => {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = original(query);
    if (!query.includes('prefers-reduced-motion')) return list;
    return Object.defineProperty(list, 'matches', { value: true });
  });
};

const scrollTo = async (top: number): Promise<void> => {
  window.scrollTo({ top, behavior: 'instant' });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
};

const compactBar = (): HTMLElement | null => document.querySelector('[data-collapsed-title]');

test('nextHidden hides scrolling down, shows scrolling up and near the top', () => {
  expect(nextHidden(false, 500, 100, 64)).toBe(true);
  expect(nextHidden(true, 400, 500, 64)).toBe(false);
  expect(nextHidden(true, 502, 500, 64)).toBe(true);
  expect(nextHidden(true, 40, 100, 64)).toBe(false);
});

test('collapseProgress runs 0 to 1 as the title passes the line, snapping under reduced motion', () => {
  expect(collapseProgress(100, 40, 0)).toBe(0);
  expect(collapseProgress(-10, 40, 0)).toBe(0.25);
  expect(collapseProgress(-60, 40, 0)).toBe(1);
  expect(collapseProgress(-10, 40, 0, true)).toBe(0);
  expect(collapseProgress(-30, 40, 0, true)).toBe(1);
});

test('a static bar is left as it was', async () => {
  const screen = await render(ScrollChromeFixture);
  const bar = screen.getByRole('banner');

  await expect.element(bar).toHaveClass('border-base-300');
  expect(bar.element().getAttribute('style')).toBeNull();
  expect(document.documentElement.style.getPropertyValue('--navbar-offset')).toBe('');
});

test('a pinned bar sticks, pads the scroller, and elevates once scrolled', async () => {
  const screen = await render(ScrollChromeFixture, { navbar: 'pinned' });
  const bar = screen.getByRole('banner');

  await expect.element(bar).toHaveStyle({ position: 'sticky' });
  await expect.element(bar).not.toHaveAttribute('data-scrolled');
  await expect.element(bar).toHaveClass('border-transparent');
  await expect
    .poll(() => document.documentElement.style.getPropertyValue('--navbar-offset'))
    .toBe(`${bar.element().getBoundingClientRect().height}px`);
  expect(document.documentElement.style.scrollPaddingTop).toBe('var(--navbar-offset)');

  await scrollTo(200);
  await expect.element(bar).toHaveAttribute('data-scrolled');
  await expect.element(bar).toHaveClass('shadow-sm');

  await scrollTo(0);
  await expect.element(bar).not.toHaveAttribute('data-scrolled');

  await screen.unmount();
  expect(document.documentElement.style.getPropertyValue('--navbar-offset')).toBe('');
  expect(document.documentElement.style.scrollPaddingTop).toBe('');
});

test('elevateOnScroll={false} keeps the border at every position', async () => {
  const screen = await render(ScrollChromeFixture, { navbar: 'pinned', elevateOnScroll: false });
  const bar = screen.getByRole('banner');

  await scrollTo(200);
  await expect.element(bar).toHaveClass('border-base-300');
  await expect.element(bar).not.toHaveAttribute('data-scrolled');
});

test('a hide-on-scroll bar slides away scrolling down, returns scrolling up and on focus', async () => {
  const screen = await render(ScrollChromeFixture, { navbar: 'hide-on-scroll' });
  const bar = screen.getByRole('banner');

  await scrollTo(100);
  await scrollTo(800);
  await expect.poll(() => bar.element().style.transform).toBe('translateY(-100%)');
  expect(document.documentElement.style.getPropertyValue('--navbar-offset')).toBe('0px');

  await scrollTo(600);
  await expect.poll(() => bar.element().style.transform).toBe('');

  await scrollTo(1200);
  await expect.poll(() => bar.element().style.transform).toBe('translateY(-100%)');
  // Still focusable while away; taking focus brings it straight back.
  screen.getByRole('link', { name: 'Garden' }).element().focus();
  await expect.poll(() => bar.element().style.transform).toBe('');
  await scrollTo(1600);
  expect(bar.element().style.transform).toBe('');
});

test('under reduced motion a hide-on-scroll bar stays pinned', async () => {
  reduceMotion();
  const screen = await render(ScrollChromeFixture, { navbar: 'hide-on-scroll' });
  const bar = screen.getByRole('banner');

  await scrollTo(100);
  await scrollTo(800);
  await expect.element(bar).toHaveAttribute('data-scrolled');
  expect(bar.element().style.transform).toBe('');
});

test('a collapsing header shows an aria-hidden compact title, keeping one h1', async () => {
  const screen = await render(ScrollChromeFixture, { header: 'collapse' });

  const bar = compactBar();
  expect(bar?.getAttribute('aria-hidden')).toBe('true');
  expect(bar?.textContent.trim()).toBe('Black Krim');
  await expect.poll(() => bar?.style.visibility).toBe('hidden');

  await scrollTo(300);
  await expect.poll(() => bar?.style.opacity).toBe('1');
  expect(bar?.style.visibility).toBe('visible');
  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Tomato ‘Black Krim’' }))
    .toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 }).elements()).toHaveLength(1);

  await scrollTo(0);
  await expect.poll(() => bar?.style.visibility).toBe('hidden');
});

test('the compact title fades in part way, and snaps under reduced motion', async () => {
  await render(ScrollChromeFixture, { header: 'collapse' });
  const title = document.querySelector('h1');
  const box = title?.getBoundingClientRect() ?? new DOMRect();
  const partWay = box.top + window.scrollY + box.height * 0.3;

  await scrollTo(partWay);
  await expect.poll(() => Number(compactBar()?.style.opacity)).toBeGreaterThan(0.1);
  expect(Number(compactBar()?.style.opacity)).toBeLessThan(0.5);

  await scrollTo(0);
  reduceMotion();
  await scrollTo(partWay);
  await expect.poll(() => compactBar()?.style.opacity).toBe('0');
});

test('scrolling a collapsing header under a pinned bar shifts no layout', async () => {
  await render(ScrollChromeFixture, { navbar: 'pinned', header: 'collapse' });
  let shift = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if ('value' in entry && typeof entry.value === 'number') shift += entry.value;
    }
  });
  observer.observe({ type: 'layout-shift' });

  for (const top of [50, 120, 240, 600, 120, 0]) await scrollTo(top);
  observer.disconnect();

  expect(shift).toBeLessThan(0.01);
});
