/**
 * The literal class tables this family looks its variants up in.
 *
 * Tailwind only generates classes it can see verbatim in source, so a
 * template string (`max-w-${size}`, `toast-${position}`) emits nothing at
 * build time. Every step is spelled out once here as a `Record<K, string>`
 * and looked up — the same discipline as `ui/tones.ts`, kept local because
 * these steps are this family's, not the whole library's.
 *
 * @module
 */

/** Width steps of a `Dialog`'s `modal-box`. */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

/** Literal `max-w-*` class per `DialogSize`; a lookup table so Tailwind's scanner sees every class. */
export const dialogSize: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Where a `Toaster` stacks its notifications. */
export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/** Literal daisyUI class per `ToastPosition` for `Toaster`; a lookup table so Tailwind's scanner sees every class. */
export const toastPosition: Record<ToastPosition, string> = {
  'top-start': 'toast-top toast-start',
  'top-center': 'toast-top toast-center',
  'top-end': 'toast-top toast-end',
  'bottom-start': 'toast-bottom toast-start',
  'bottom-center': 'toast-bottom toast-center',
  'bottom-end': 'toast-bottom toast-end',
};

/** Height steps of a `SegmentBar`. */
export type BarSize = 'sm' | 'md' | 'lg';

/** Literal height class per `BarSize`; a lookup table so Tailwind's scanner sees every class. */
export const barSize: Record<BarSize, string> = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
};

/** How a `Stats` row lays its tiles out. */
export type StatsOrientation = 'horizontal' | 'vertical' | 'responsive';

/** Literal daisyUI class per `StatsOrientation` for `Stats`; a lookup table so Tailwind's scanner sees every class. */
export const statsOrientation: Record<StatsOrientation, string> = {
  horizontal: 'stats-horizontal',
  vertical: 'stats-vertical',
  // Stacked on a phone, in a row from `sm` up — the shape every app's
  // dashboard reached for by hand.
  responsive: 'stats-vertical sm:stats-horizontal',
};
