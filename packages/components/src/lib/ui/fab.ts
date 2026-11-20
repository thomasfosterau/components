/**
 * Shared types and class tables for `FloatingActionButton` and `FabMenu`.
 *
 * @module
 */

import type { Snippet } from 'svelte';

/** A floating action button's size step. */
export type FabSize = 'sm' | 'md' | 'lg';

/** Where a floating action button sits; `'inline'` opts out of fixed positioning. */
export type FabPosition = 'end' | 'center' | 'start' | 'inline';

/** One action of a `FabMenu`. Its label is always shown beside the icon. */
export interface FabMenuItem {
  readonly label: string;
  readonly icon?: Snippet<[]> | undefined;
  /** Runs on activation; the menu closes first. */
  readonly onSelect?: (() => void) | undefined;
  /** Navigates instead, resolved through the components context. */
  readonly href?: string | undefined;
}

/** daisyUI size classes per `FabSize`; a lookup table so Tailwind sees every class. */
export const fabSize: Readonly<Record<FabSize, string>> = {
  sm: 'btn-sm',
  md: 'btn-lg',
  lg: 'btn-xl',
};

/** Fixed placement per `FabPosition`, above the safe-area inset and below `Toaster` (`z-50`). */
export const fabPosition: Readonly<Record<FabPosition, string>> = {
  end: 'fixed z-30 end-4 bottom-[calc(1rem+env(safe-area-inset-bottom))]',
  start: 'fixed z-30 start-4 bottom-[calc(1rem+env(safe-area-inset-bottom))]',
  center: 'fixed z-30 inset-x-0 mx-auto w-fit bottom-[calc(1rem+env(safe-area-inset-bottom))]',
  inline: '',
};
