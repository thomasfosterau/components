/**
 * `@thomasfosterau/components/tips` — a separate entry point so it never sits on
 * the always-loaded path of a consumer that does not use it.
 *
 * TipKit — contextual, dismissible guidance: an inline tip, a tip anchored to
 * its trigger, the store that decides when either may show, and the stack
 * that decides which one Escape closes.
 *
 * @module
 */

export { default as PopoverTip } from './PopoverTip.svelte';
export { default as Tip } from './Tip.svelte';
export { createTipStack, soloTipStack, type TipStack } from './tip-stack.ts';
export {
  browserTipStorage,
  createTipStore,
  memoryTipStorage,
  type TipStorage,
  type TipStoreOptions,
  type TipStore,
} from './tip-store.svelte.ts';
export type {
  TipAction,
  TipConfig,
  TipFrequency,
  TipPlacement,
  TipRule,
  TipState,
  TipStatus,
} from './types.ts';
