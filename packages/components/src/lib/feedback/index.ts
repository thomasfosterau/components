/**
 * feedback — dialogs, toasts, progress and the chrome around a pending read.
 *
 * What these have in common is that they speak to the reader about something
 * that just happened, or is happening now: a confirmation to give, a result
 * to notice, a number to compare, a wait to explain. That makes the live
 * regions and the announcement order the contract — see each component's
 * header comment — rather than the markup.
 *
 * As in `ui/`, every optional prop is declared `T | undefined`: the workspace
 * compiles with `exactOptionalPropertyTypes`, under which `prop?: T` rejects
 * an explicitly passed `undefined`, and these components are composed by
 * callers forwarding their own optional props straight through.
 *
 * @module
 */

export { default as ConfirmDialog } from './ConfirmDialog.svelte';
export { default as Dialog } from './Dialog.svelte';
export { default as LoadingBoundary } from './LoadingBoundary.svelte';
export { default as ProgressBar } from './ProgressBar.svelte';
export { default as SegmentBar } from './SegmentBar.svelte';
export { default as StatTile } from './StatTile.svelte';
export { default as Stats } from './Stats.svelte';
export { default as Steps } from './Steps.svelte';
export { default as Timeline } from './Timeline.svelte';
export { default as Toaster } from './Toaster.svelte';

export type { ConfirmForm } from './ConfirmDialog.svelte';
export type { BarSegment } from './SegmentBar.svelte';
export type { StatDelta } from './StatTile.svelte';
export type { StepItem, StepState } from './Steps.svelte';
export type { TimelineDate, TimelineEntry } from './Timeline.svelte';

export * from './sizes.ts';
export * from './toaster.ts';
