/**
 * The action shape `SwipeActions` takes, and the context a `SwipeGroup` uses
 * to keep one row open at a time.
 *
 * @module
 */

import { getContext, setContext, type Snippet } from 'svelte';
import type { Tone } from '../ui/tones.ts';

/** One action behind a swipeable row, and in its "More actions" menu. */
export interface SwipeAction {
  /** The button's text and the menu item's name. */
  readonly label: string;
  /** Shown above the label; decorative. */
  readonly icon?: Snippet<[]> | undefined;
  readonly onAction: () => void | Promise<void>;
  /** The revealed button's colour; never the only cue, since the label always shows. Defaults to `'error'` for a destructive action, else `'neutral'`. */
  readonly tone?: Tone | undefined;
  /** Listed last and in the error tone in the menu. Pair a full swipe on one with an Undo toast. */
  readonly destructive?: boolean | undefined;
}

/** Which row of a `SwipeGroup` is open, by the row's id. */
class SwipeGroupState {
  open: string | undefined = $state();
}

const CONTEXT_KEY = Symbol('@thomasfosterau/components:swipe-group');

/** Provides a fresh group to the rows below the calling component. */
export function setSwipeGroup(): SwipeGroupState {
  return setContext(CONTEXT_KEY, new SwipeGroupState());
}

/** The nearest `SwipeGroup`, or `undefined` outside one. */
export function getSwipeGroup(): SwipeGroupState | undefined {
  return getContext<SwipeGroupState | undefined>(CONTEXT_KEY);
}

/** A revealed action button's colours per tone; a lookup table so Tailwind sees every class. */
export const swipeActionTone: Readonly<Record<Tone, string>> = {
  neutral: 'bg-neutral text-neutral-content',
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  accent: 'bg-accent text-accent-content',
  info: 'bg-info text-info-content',
  success: 'bg-success text-success-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
};
