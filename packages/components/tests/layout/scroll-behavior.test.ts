/**
 * The scroll behaviours of `Navbar` and `PageHeader`: a pinned bar's
 * elevation and scroll padding, a hide-on-scroll bar that comes back on
 * focus and stays put under reduced motion, and a collapsing title that
 * keeps one heading in the tree without shifting layout, on a CSS view
 * timeline where the browser has one and a scroll handler where it does not.
 */

import { afterEach, expect, test, vi } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/browser';
import type { CDPSession } from 'vite-plus/test/browser-playwright';
import { render } from 'vitest-browser-svelte';
import {
  barFrame,
  collapseProgress,
  nextHidden,
  scrollTimelines,
} from '../../src/lib/layout/scroll-behavior.ts';
import ScrollChromeFixture from './fixtures/ScrollChromeFixture.svelte';

/** `cdp()` is typed without the Playwright provider's `send`, which this suite runs on. */
const playwrightSession = (session: object): session is CDPSession => 'send' in session;

/** Emulate media features in CSS as well as script. */
const emulateMedia = async (features: { name: string; value: string }[]): Promise<void> => {
  const session = cdp();
  if (!playwrightSession(session)) throw new Error('This suite needs the Playwright provider');
  await session.send('Emulation.setEmulatedMedia', { features });
};

afterEach(async () => {
  vi.restoreAllMocks();
  await emulateMedia([]);
  window.scrollTo({ top: 0, behavior: 'instant' });
});

/** Make `prefers-reduced-motion: reduce` match for this test, in script and in CSS. */
const reduceMotion = async (): Promise<void> => {
  await emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
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

/** The compact bar's opacity and visibility as drawn, whichever path set them. */
const drawn = (): { opacity: number; visibility: string } => {
  const bar = compactBar();
  if (bar === null) return { opacity: Number.NaN, visibility: '' };
  const style = getComputedStyle(bar);
  return { opacity: Number(style.opacity), visibility: style.visibility };
};

/** The opacity the scroll handler wrote, under whatever an animation draws. */
const inline = (): number => Number(compactBar()?.style.opacity);

/** Run a test without scroll-driven animations, on the scroll handler. */
const withoutTimelines = (): void => {
  const supports = CSS.supports.bind(CSS);
  vi.spyOn(CSS, 'supports').mockImplementation((condition: string, value?: string) => {
    if (condition.includes('animation-timeline')) return false;
    return value === undefined ? supports(condition) : supports(condition, value);
  });
};

/** A scroll offset that puts `fraction` of the h1 past `line` px from the top. */
const partWay = (fraction: number, line = 0): number => {
  const box = document.querySelector('h1')?.getBoundingClientRect() ?? new DOMRect();
  return box.top + window.scrollY - line + box.height * fraction;
};

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

test('barFrame spans a scroll container, below its navbar offset', () => {
  const container = document.createElement('div');
  container.style.cssText =
    'position: absolute; top: 40px; left: 30px; width: 200px; height: 100px;';
  container.style.setProperty('--navbar-offset', '12px');
  document.body.append(container);
  expect(barFrame(container)).toEqual({ top: 40, left: 30, width: 200, offset: 12 });
  container.remove();
  expect(barFrame(undefined)).toEqual({
    top: 0,
    left: 0,
    width: document.documentElement.clientWidth,
    offset: 0,
  });
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
  await reduceMotion();
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
  await expect.poll(() => drawn().visibility).toBe('hidden');

  await scrollTo(300);
  await expect.poll(drawn).toEqual({ opacity: 1, visibility: 'visible' });
  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Tomato ‘Black Krim’' }))
    .toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 }).elements()).toHaveLength(1);

  await scrollTo(0);
  await expect.poll(() => drawn().visibility).toBe('hidden');
});

test('the view timeline fades part way, and snaps at halfway under reduced motion', async () => {
  expect(scrollTimelines()).toBe(true);
  await render(ScrollChromeFixture, { header: 'collapse' });

  await scrollTo(partWay(0.3));
  await expect.poll(() => drawn().opacity).toBeGreaterThan(0.1);
  expect(drawn().opacity).toBeLessThan(0.5);
  expect(drawn().visibility).toBe('visible');
  // The scroll handler never ran: the animation is drawing over the inline 0.
  expect(compactBar()?.style.opacity).toBe('0');

  await reduceMotion();
  await scrollTo(partWay(0.4));
  await expect.poll(drawn).toEqual({ opacity: 0, visibility: 'hidden' });
  await scrollTo(partWay(0.6));
  await expect.poll(drawn).toEqual({ opacity: 1, visibility: 'visible' });
});

test('the view timeline starts below a pinned bar', async () => {
  const screen = await render(ScrollChromeFixture, { navbar: 'pinned', header: 'collapse' });
  const line = screen.getByRole('banner').element().getBoundingClientRect().height;
  await expect
    .poll(() => document.documentElement.style.getPropertyValue('--navbar-offset'))
    .toBe(`${line}px`);

  await scrollTo(partWay(0.3, line));
  await expect.poll(() => drawn().opacity).toBeGreaterThan(0.1);
  expect(drawn().opacity).toBeLessThan(0.5);
  expect(compactBar()?.getBoundingClientRect().top).toBeCloseTo(line, 0);
});

// The `@supports` rules still apply in this Chromium, so this reads the
// inline opacity the scroll handler writes rather than the drawn one.
test('without scroll timelines, the scroll handler fades part way and snaps under reduced motion', async () => {
  withoutTimelines();
  await render(ScrollChromeFixture, { header: 'collapse' });

  await scrollTo(partWay(0.3));
  await expect.poll(inline).toBeGreaterThan(0.1);
  expect(inline()).toBeLessThan(0.5);

  await scrollTo(0);
  await reduceMotion();
  await scrollTo(partWay(0.3));
  await expect.poll(inline).toBe(0);
  await scrollTo(partWay(0.6));
  await expect.poll(inline).toBe(1);
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
