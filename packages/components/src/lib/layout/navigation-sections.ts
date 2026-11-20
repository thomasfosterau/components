/**
 * Whether a `NavigationMenu` section holds the page being shown, shared by its
 * horizontal and vertical renderings.
 *
 * @module
 */

import type { NavigationSection } from './types.ts';

/** Whether any of `section`'s panel links is the current page. */
export const holdsCurrentPage = (
  section: NavigationSection,
  isCurrent: (href: string) => boolean,
): boolean => (section.links ?? []).some((link) => isCurrent(link.href));
