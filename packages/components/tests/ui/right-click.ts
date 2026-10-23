/**
 * A real right-click, through the Playwright provider.
 *
 * Vitest declares `UserEventClickOptions` empty as the seam a browser provider
 * fills in (see `tests/canvas/pointer.ts`); `@vitest/browser-playwright`
 * forwards the options verbatim to `locator.click`, so `button: 'right'` is
 * Chromium's own trusted `contextmenu`, not a dispatched event.
 *
 * @module tests/ui/right-click
 */

import { userEvent, type Locator } from 'vite-plus/test/browser';

declare module '@vitest/browser/context' {
  interface UserEventClickOptions {
    button?: 'left' | 'right' | 'middle';
  }
}

/** Right-click the element, opening any context menu it carries. */
export function rightClick(target: Locator): Promise<void> {
  return userEvent.click(target, { button: 'right' });
}
