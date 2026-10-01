/**
 * The toaster seam: what a toast is, and how anything below a `<Toaster>`
 * reaches the one region on the page.
 *
 * Kept out of `Toaster.svelte` so a module that only wants to *push* a toast
 * — a store, a form helper, another component — imports a `.ts` file rather
 * than pulling a component (and its icons) onto its own path.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';
import type { StatusTone } from '../ui/tones.ts';

/** The colour a toast is drawn in; the same four states an `Alert` has. */
export type ToastTone = StatusTone;

/** One notification as the `Toaster` holds it, after it has been given an id. */
export interface Toast {
  /** Assigned by the toaster; unique for the life of the page. */
  readonly id: number;
  /** The line that carries the message. */
  readonly title: string;
  /** Optional second line. */
  readonly description?: string | undefined;
  readonly tone: ToastTone;
}

/** What a toast looks like before the toaster has given it an id. */
export type NewToast = Omit<Toast, 'id' | 'tone'> & { readonly tone?: ToastTone | undefined };

/** What `getToaster()` returns: push a toast or dismiss one. */
export interface ToasterApi {
  /**
   * Push a toast and return its id. It dismisses itself after `durationMs`
   * (the `<Toaster>`'s own default when omitted); `0` makes it sticky, for a
   * message the reader must act on.
   */
  add(toast: NewToast, durationMs?: number): number;
  /** Remove a toast early — the dismiss button, or the app itself. */
  dismiss(id: number): void;
}

const TOASTER_KEY = Symbol('@thomasfosterau/components:toaster');

/** Publish the region's API to its descendants. Called by `Toaster`. */
export function setToaster(api: ToasterApi): void {
  setContext<ToasterApi>(TOASTER_KEY, api);
}

/**
 * The nearest `<Toaster>`'s API.
 *
 * Throws when there is no provider: a silently dropped notification is worse
 * than a loud failure in development, and every call site is inside the app's
 * own layout where the provider is mounted once.
 */
export function getToaster(): ToasterApi {
  const api = getContext<ToasterApi | undefined>(TOASTER_KEY);
  if (api === undefined) throw new Error('getToaster() was called outside a <Toaster>');
  return api;
}
