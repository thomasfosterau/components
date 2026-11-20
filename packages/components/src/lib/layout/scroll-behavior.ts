/**
 * The scroll arithmetic behind `Navbar`'s and `PageHeader`'s scroll
 * behaviours: a once-per-frame scroll reader, when a hide-on-scroll bar
 * hides, and how far a large title has collapsed.
 *
 * @module
 */

/** How the top bar responds to scrolling. */
export type NavbarScrollBehavior = 'static' | 'pinned' | 'hide-on-scroll';

/** How a page header responds to scrolling. */
export type PageHeaderScrollBehavior = 'static' | 'collapse';

/**
 * Calls `onScroll` with the scroll offset of `container` (or the window) now
 * and then at most once per animation frame while it scrolls. Returns the
 * teardown.
 */
export const watchScroll = (
  container: HTMLElement | undefined,
  onScroll: (top: number) => void,
): (() => void) => {
  const target = container ?? window;
  let frame: number | undefined;
  const read = (): void => {
    frame = undefined;
    onScroll(container === undefined ? window.scrollY : container.scrollTop);
  };
  const schedule = (): void => {
    frame ??= requestAnimationFrame(read);
  };
  target.addEventListener('scroll', schedule, { passive: true });
  read();
  return () => {
    target.removeEventListener('scroll', schedule);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
};

/**
 * Whether a hide-on-scroll bar is hidden after scrolling from `previous` to
 * `top`: shown within `height` of the top, hidden scrolling down, shown
 * scrolling up, unchanged by jitter of `slack` px or less.
 */
export const nextHidden = (
  hidden: boolean,
  top: number,
  previous: number,
  height: number,
  slack = 4,
): boolean => {
  if (top <= height) return false;
  if (top > previous + slack) return true;
  if (top < previous - slack) return false;
  return hidden;
};

/**
 * How far a large title has collapsed, 0 to 1: how much of it, `titleTop`
 * to `titleTop + titleHeight` in viewport px, has passed above `line`. Under
 * reduced motion it snaps to 0 or 1 at the halfway point.
 */
export const collapseProgress = (
  titleTop: number,
  titleHeight: number,
  line: number,
  reduced = false,
): number => {
  const progress = Math.min(Math.max((line - titleTop) / Math.max(titleHeight, 1), 0), 1);
  if (!reduced) return progress;
  return progress >= 0.5 ? 1 : 0;
};

/**
 * Where a collapsed title bar goes, in viewport px: across the top of
 * `container` (or the viewport), below a stuck `Navbar`'s `--navbar-offset`.
 */
export const barFrame = (
  container: HTMLElement | undefined,
): { readonly top: number; readonly left: number; readonly width: number } => {
  const scroller = container ?? document.documentElement;
  const offset =
    Number.parseFloat(getComputedStyle(scroller).getPropertyValue('--navbar-offset')) || 0;
  if (container === undefined) {
    return { top: offset, left: 0, width: document.documentElement.clientWidth };
  }
  const box = container.getBoundingClientRect();
  return { top: box.top + offset, left: box.left, width: box.width };
};

/** Whether the reader asked for reduced motion; read when needed, not cached. */
export const reducedMotion = (): boolean =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
