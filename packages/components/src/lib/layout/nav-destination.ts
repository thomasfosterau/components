/**
 * One declaration of an app's primary destinations, read by every navigation
 * rendering in the `layout/` family: `NavigationRail` directly, and
 * `AppShell`'s adaptive mode, which turns the same list into a `BottomNav`,
 * a `NavigationRail` or a `Sidebar` by width. Declaring the destinations once
 * is the point — copies per component drift.
 *
 * Also the class tables `AppShell` shows and hides those three tiers with:
 * literal, because Tailwind generates only the classes it can see verbatim in
 * source.
 *
 * @module
 */

import type { Snippet } from 'svelte';

/** One top-level destination of an app. */
export interface NavDestination {
  /** App-relative path, resolved through the components context's `href()`. */
  readonly href: string;
  /** The visible label, and the link's accessible name. */
  readonly label: string;
  /** The icon. Decorative: the rendering hides it from assistive technology. */
  readonly icon: Snippet<[]>;
  /** The icon while this destination is current (a filled variant). Omitted, `icon`. */
  readonly currentIcon?: Snippet<[]> | undefined;
  /** A count or marker beside the icon (unread notifications), announced through the rendering's `badgeLabel`. */
  readonly badge?: string | number | undefined;
  /**
   * `false` keeps the destination out of the compact bottom bar (which holds
   * five at most) but in the rail and the sidebar.
   */
  readonly compact?: boolean | undefined;
}

/** The width (Tailwind breakpoint) at which `AppShell` swaps the bottom bar for the rail. */
export type MediumAt = 'sm' | 'md';

/** The width (Tailwind breakpoint) at which `AppShell` swaps the rail for the sidebar. */
export type ExpandedAt = 'lg' | 'xl';

/** `AppShell`'s two adaptive breakpoints. */
export interface NavBreakpoints {
  readonly medium: MediumAt;
  readonly expanded: ExpandedAt;
}

/** The bottom bar: shown below the medium breakpoint only. */
export const compactTier: Record<MediumAt, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
};

/** The content column's padding for the fixed bottom bar, below the medium breakpoint only. */
export const compactPadding: Record<MediumAt, string> = {
  sm: 'pb-(--bottom-nav-height) sm:pb-0',
  md: 'pb-(--bottom-nav-height) md:pb-0',
};

/** The rail: shown from the medium breakpoint up to the expanded one. */
export const mediumTier: Record<MediumAt, Record<ExpandedAt, string>> = {
  sm: { lg: 'hidden sm:flex lg:hidden', xl: 'hidden sm:flex xl:hidden' },
  md: { lg: 'hidden md:flex lg:hidden', xl: 'hidden md:flex xl:hidden' },
};

/** The sidebar: shown from the expanded breakpoint up. */
export const expandedTier: Record<ExpandedAt, string> = {
  lg: 'hidden lg:flex',
  xl: 'hidden xl:flex',
};

/** The destinations the compact bottom bar holds: all but `compact: false`. */
export const compactDestinations = (
  destinations: readonly NavDestination[],
): readonly NavDestination[] => destinations.filter((destination) => destination.compact !== false);
