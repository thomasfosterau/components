/**
 * The vocabulary the `layout/` family's list-shaped props are written in, and
 * the literal daisyUI class tables its variants look up.
 *
 * The tables are local to this family rather than added to `ui/tones.ts`
 * because `tabs-*` is a layout word: no `ui/` component renders a tab strip,
 * and a table nobody outside one family reads is a table that belongs beside
 * that family. The reason they are tables at all is the repo-wide one —
 * Tailwind generates only the classes it can see verbatim in source, so a
 * `tabs-${variant}` template string emits no CSS whatsoever.
 *
 * @module
 */

import type { Size } from '../ui/tones.ts';

/** One step of a {@link Breadcrumbs} trail. */
export interface Crumb {
  readonly label: string;
  /**
   * Where the crumb points. The TRAILING crumb is rendered as text whether or
   * not it carries one — it is the page you are already on.
   */
  readonly href?: string | undefined;
}

/** One entry of a {@link Tabs} strip, in either mode. */
export interface TabItem {
  /** Stable key, and the value `Tabs` selects on in `panels` mode. */
  readonly value: string;
  readonly label: string;
  /** The route, in `links` mode. Ignored by `panels`. */
  readonly href?: string | undefined;
  readonly disabled?: boolean | undefined;
}

/** One option of a {@link FilterBar}. */
export interface FilterOption {
  /** Stable key for the keyed `{#each}`. */
  readonly key: string;
  readonly label: string;
  readonly href: string;
  /**
   * Whether this option is the view currently shown. The caller's to decide:
   * only the page knows which axis the row is filtering on.
   */
  readonly active: boolean;
}

/** `panels` is a tab widget; `links` is navigation between sibling routes. */
export type TabsMode = 'panels' | 'links';

/** The three daisyUI tab treatments. */
export type TabsVariant = 'border' | 'box' | 'lift';

/** Literal daisyUI class per `TabsVariant` for `Tabs`; a lookup table so Tailwind's scanner sees every class. */
export const tabsVariant: Record<TabsVariant, string> = {
  border: 'tabs-border',
  box: 'tabs-box',
  lift: 'tabs-lift',
};

/** Literal daisyUI class per `Size` for `Tabs`; a lookup table so Tailwind's scanner sees every class. */
export const tabsSize: Record<Size, string> = {
  xs: 'tabs-xs',
  sm: 'tabs-sm',
  md: 'tabs-md',
  lg: 'tabs-lg',
  xl: 'tabs-xl',
};

/** The width class at which an adaptive layout's panes sit side by side. */
export type ExpandAt = 'md' | 'lg' | 'xl';

/** The media query for each {@link ExpandAt}: Tailwind's default breakpoints. */
export const expandQuery: Record<ExpandAt, string> = {
  md: '(min-width: 48rem)',
  lg: '(min-width: 64rem)',
  xl: '(min-width: 80rem)',
};

/**
 * A pane shown only from the breakpoint up (hidden on compact widths), and a
 * pane shown on compact widths but also from the breakpoint up. Literal so
 * Tailwind's scanner sees every class.
 */
export const paneFromBreakpoint: Record<ExpandAt, string> = {
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
  xl: 'hidden xl:flex',
};

/** The two-column grid of a `ListDetailLayout`, from its breakpoint up. */
export const listDetailGrid: Record<ExpandAt, string> = {
  md: 'md:grid md:grid-cols-[var(--list-width)_1fr]',
  lg: 'lg:grid lg:grid-cols-[var(--list-width)_1fr]',
  xl: 'xl:grid xl:grid-cols-[var(--list-width)_1fr]',
};

/** The list pane's border, from the breakpoint up, where it sits beside the detail. */
export const listDivider: Record<ExpandAt, string> = {
  md: 'md:border-e md:border-base-300',
  lg: 'lg:border-e lg:border-base-300',
  xl: 'xl:border-e xl:border-base-300',
};

/** The Back link of a `ListDetailLayout`, shown only on compact widths. */
export const compactOnly: Record<ExpandAt, string> = {
  md: 'md:hidden',
  lg: 'lg:hidden',
  xl: 'xl:hidden',
};

/** The list pane's width: data, set as the `--list-width` custom property. */
export const listWidth: Record<'sm' | 'md' | 'lg', string> = {
  sm: '20rem',
  md: '24rem',
  lg: '28rem',
};
