/**
 * hotkeys — the registry that answers "what can the viewer do right now", and
 * the two surfaces that read it back.
 *
 * An app creates one registry in its root layout (`createHotkeyRegistry`),
 * renders `HotkeyProvider` once to mount the key listener, and registers
 * actions from anywhere below with `registerHotkeys` — global ones from the
 * layout, page ones from the page, torn down when it unmounts. `search/`'s
 * `CommandPalette` and `HotkeyHelpDialog` then list exactly what is live.
 *
 * Everything user-facing is a prop: the registry stores the labels the app
 * registered, and the two components take their own chrome copy
 * (`title`, `closeLabel`, `commandLabel`, …) with English defaults.
 *
 * The family is re-exported from the root barrel and is also its own entry,
 * `@thomasfosterau/components/hotkeys`, so a consumer can
 * `import('@thomasfosterau/components/hotkeys')` to load `HotkeyHelpDialog`
 * lazily, on the first `?`, instead of in its entry chunk.
 *
 * @module
 */

export {
  HotkeyRegistryMissing,
  createHotkeyRegistry,
  getHotkeyRegistry,
  registerHotkeys,
  tryGetHotkeyRegistry,
} from './context.svelte.ts';
export { HotkeyRegistry, type HotkeyRegistryOptions } from './registry.svelte.ts';
export { default as HotkeyBadge } from './HotkeyBadge.svelte';
export { default as HotkeyHelpDialog } from './HotkeyHelpDialog.svelte';
export { default as HotkeyProvider } from './HotkeyProvider.svelte';
export {
  SEQUENCE_TIMEOUT_MS,
  hasChordModifier,
  isApplePlatform,
  isEditableTarget,
  isSequenceKey,
  matchChord,
  matchSequence,
  triggerDisplay,
  type SequenceMatch,
  type TriggerDisplay,
} from './match.ts';
export type {
  CommandAction,
  CommandActionGroup,
  HotkeyChord,
  HotkeyScope,
  HotkeySequence,
  HotkeyTrigger,
  RegisteredAction,
} from './types.ts';
