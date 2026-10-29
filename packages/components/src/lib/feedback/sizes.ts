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

/** How a `Steps` list lays its steps out. */
export type StepsOrientation = 'horizontal' | 'vertical' | 'responsive';

/** Literal daisyUI class per `StepsOrientation` for `Steps`; a lookup table so Tailwind's scanner sees every class. */
export const stepsOrientation: Record<StepsOrientation, string> = {
  horizontal: 'steps-horizontal',
  vertical: 'steps-vertical',
  // A column on a phone, a row from `sm` up, as `statsOrientation` does.
  responsive: 'steps-vertical sm:steps-horizontal',
};

/** The edge a `Drawer` enters from; `start` / `end` follow the writing direction. */
export type DrawerSide = 'start' | 'end' | 'top' | 'bottom';

/** Literal placement classes per `DrawerSide`; a lookup table so Tailwind's scanner sees every class. */
export const drawerSide: Record<DrawerSide, string> = {
  start: 'inset-y-0 start-0 h-full max-w-[calc(100vw-2rem)]',
  end: 'inset-y-0 end-0 h-full max-w-[calc(100vw-2rem)]',
  top: 'inset-x-0 top-0 max-h-[85dvh] rounded-b-box',
  bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-box',
};

/** Size steps of a `Drawer`: its width at `start` / `end`, its height at `top` / `bottom`. */
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

/** Literal width class per `DrawerSize` for a `start` / `end` drawer. */
export const drawerWidth: Record<DrawerSize, string> = {
  sm: 'w-72',
  md: 'w-96',
  lg: 'w-[32rem]',
  full: 'w-screen max-w-none',
};

/** Literal height class per `DrawerSize` for a `top` / `bottom` drawer. */
export const drawerHeight: Record<DrawerSize, string> = {
  sm: 'h-[33dvh]',
  md: 'h-[50dvh]',
  lg: 'h-[75dvh]',
  full: 'h-dvh max-h-none rounded-none',
};
