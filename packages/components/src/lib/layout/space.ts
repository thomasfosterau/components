/**
 * The library's spacing rhythm and the layout primitives' vocabulary, as
 * literal class tables.
 *
 * `VStack`, `HStack`, `Cluster`, `Grid` and `Fits` take tokens, not class
 * names, so every app spaces things on the same scale. Tailwind only
 * generates classes it can see verbatim in source, so each step is spelled
 * out once here and looked up (the `ui/tones.ts` discipline).
 *
 * @module
 */

/** A step on the spacing scale. */
export type Gap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Literal `gap-*` class per `Gap`; a lookup table so Tailwind's scanner sees every class. */
export const gapClass: Record<Gap, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-8',
  xl: 'gap-12',
};

/** Cross-axis alignment of a stack's or cluster's items. */
export type FlowAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** Literal `items-*` class per `FlowAlign`; a lookup table so Tailwind's scanner sees every class. */
export const alignClass: Record<FlowAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

/** Main-axis distribution of a stack's or cluster's items. */
export type FlowJustify = 'start' | 'center' | 'end' | 'between';

/** Literal `justify-*` class per `FlowJustify`; a lookup table so Tailwind's scanner sees every class. */
export const justifyClass: Record<FlowJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

/** The narrowest an item of a `Grid` gets before the grid drops a column. */
export type MinItem = 'xs' | 'sm' | 'md' | 'lg';

/** Literal auto-fill column template per `MinItem`; a lookup table so Tailwind's scanner sees every class. */
export const minItemClass: Record<MinItem, string> = {
  xs: 'grid-cols-[repeat(auto-fill,minmax(min(10rem,100%),1fr))]',
  sm: 'grid-cols-[repeat(auto-fill,minmax(min(12rem,100%),1fr))]',
  md: 'grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))]',
  lg: 'grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))]',
};

/** The element a primitive renders. A list (`ul` / `ol`) takes `<li>` children. */
export type FlowElement = 'div' | 'ul' | 'ol' | 'section' | 'nav';

/** A container width at which a `Fits` layout stops fitting. */
export type FitsBreakpoint = '20rem' | '28rem' | '36rem' | '48rem' | '64rem';

/** Literal container-query class showing a `Fits` layout from this width up. */
export const fitsShowFrom: Record<FitsBreakpoint, string> = {
  '20rem': '@min-[20rem]:block',
  '28rem': '@min-[28rem]:block',
  '36rem': '@min-[36rem]:block',
  '48rem': '@min-[48rem]:block',
  '64rem': '@min-[64rem]:block',
};

/** Literal container-query class hiding a `Fits` layout from this width up. */
export const fitsHideFrom: Record<FitsBreakpoint, string> = {
  '20rem': '@min-[20rem]:hidden',
  '28rem': '@min-[28rem]:hidden',
  '36rem': '@min-[36rem]:hidden',
  '48rem': '@min-[48rem]:hidden',
  '64rem': '@min-[64rem]:hidden',
};

/**
 * The classes of `Fits` layout `index` of `count`, given the widths at which
 * each stops fitting (`breakpoints[i]` for layout `i`, one fewer than the
 * layouts). The first shows from `breakpoints[0]` up, each next one between
 * its own breakpoint and the previous one, and the last below the final
 * breakpoint. Outside its band a layout is `display: none`, so it is out of
 * the accessibility tree.
 */
export function fitsLayoutClass(
  index: number,
  count: number,
  breakpoints: readonly FitsBreakpoint[],
): string[] {
  const own = breakpoints[index];
  const previous = index === 0 ? undefined : breakpoints[index - 1];
  const isLast = index === count - 1;
  return [
    isLast ? 'block' : 'hidden',
    !isLast && own !== undefined ? fitsShowFrom[own] : '',
    previous === undefined ? '' : fitsHideFrom[previous],
  ].filter((name) => name !== '');
}
