/**
 * Fitting one line of text to a width by cutting it at the start or in the
 * middle, for `Truncate`. The measurer is passed in, so this is pure.
 *
 * @module
 */

/** The rendered width of `text`, in the same unit as the width it must fit. */
export type MeasureText = (text: string) => number;

/** Where the text is cut. */
export type TruncatePosition = 'end' | 'middle' | 'start';

const ELLIPSIS = '…';

/**
 * How many trailing characters middle truncation keeps by default: the last
 * path segment with its slash, or the extension with its dot, when either is
 * short enough to be worth keeping.
 */
export const defaultKeepEnd = (text: string): number => {
  const slash = text.lastIndexOf('/');
  if (slash > 0 && slash < text.length - 1 && text.length - slash <= 24) return text.length - slash;
  const dot = text.lastIndexOf('.');
  if (dot > 0 && text.length - dot <= 8) return text.length - dot;
  return 0;
};

/** `text` with `kept` characters left, cut at `position`, never splitting `keepEnd` in the middle mode. */
const cut = (text: string, kept: number, position: 'middle' | 'start', keepEnd: number): string => {
  if (position === 'start') return ELLIPSIS + text.slice(text.length - kept);
  const tail = Math.min(kept, Math.max(keepEnd, Math.ceil(kept / 2)));
  return text.slice(0, kept - tail) + ELLIPSIS + text.slice(text.length - tail);
};

/**
 * The longest cut of `text` whose measured width fits `width`: `text` itself
 * when it fits, `'…'` when nothing else does. Binary search on the number of
 * characters kept, so it measures about log₂(length) candidates.
 */
export const truncateText = (
  text: string,
  width: number,
  measure: MeasureText,
  position: 'middle' | 'start',
  keepEnd: number = defaultKeepEnd(text),
): string => {
  if (measure(text) <= width) return text;
  let low = 0;
  let high = text.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (measure(cut(text, mid, position, keepEnd)) <= width) low = mid;
    else high = mid - 1;
  }
  return cut(text, low, position, keepEnd);
};

/** A measurer for `element`'s computed font, on a canvas made once per call. */
export const canvasMeasure = (element: Element): MeasureText => {
  const context = document.createElement('canvas').getContext('2d');
  if (context === null) return () => 0;
  const style = getComputedStyle(element);
  context.font = style.font;
  return (text) => context.measureText(text).width;
};
