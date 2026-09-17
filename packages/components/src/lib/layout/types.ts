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

export const tabsVariant: Record<TabsVariant, string> = {
  border: 'tabs-border',
  box: 'tabs-box',
  lift: 'tabs-lift',
};

export const tabsSize: Record<Size, string> = {
  xs: 'tabs-xs',
  sm: 'tabs-sm',
  md: 'tabs-md',
  lg: 'tabs-lg',
  xl: 'tabs-xl',
};
