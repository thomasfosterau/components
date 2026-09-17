/**
 * Pure key-matching helpers for the hotkey registry. No Svelte, no DOM
 * mutation — just functions over `KeyboardEvent`s, trigger grammars and the
 * sequence buffer, so the matching rules stay testable and `HotkeyProvider`
 * stays thin.
 *
 * Trigger model:
 *
 * - **Modifier chords** (`'$mod+k'`) — held together. `$mod` is ⌘ on macOS
 *   and Ctrl elsewhere. Matched on their own; never buffered.
 * - **Plain keys / sequences** (`'e'`, `'/'`, `['g', 'p']`) — pressed in
 *   order with no modifier held. A plain single key is just a sequence of
 *   length one, so matching is uniform.
 *
 * @module
 */

import type { CommandAction, HotkeyTrigger, RegisteredAction } from './types.ts';

/** Sequence buffer entries expire after this many milliseconds. */
export const SEQUENCE_TIMEOUT_MS = 1000;

/** Whether the runtime platform treats `$mod` as ⌘ (macOS / iOS). */
export function isApplePlatform(): boolean {
  // `globalThis.navigator` rather than the bare identifier: on a runtime
  // without one, a direct reference would throw before the guard could run.
  if (typeof globalThis.navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(globalThis.navigator.platform);
}

/**
 * Whether a keyboard event's target is an editable surface — a form field or
 * a contenteditable region (which covers a rich-text editor's root). Hotkeys
 * without `allowInEditable` stay inert there so typing never fires actions.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches('input, textarea, select') || target.isContentEditable;
}

/** Whether a trigger is in the modifier-chord form (`'$mod+…'`). */
function isModifierChord(trigger: HotkeyTrigger): boolean {
  return typeof trigger === 'string' && trigger.includes('+');
}

/** Normalise a plain-key trigger to its sequence form. `undefined` for a chord. */
function asSequence(trigger: HotkeyTrigger): readonly string[] | undefined {
  if (typeof trigger === 'string') {
    return isModifierChord(trigger) ? undefined : [trigger];
  }
  return trigger;
}

/** Whether the event matches a `'$mod+key'` chord. */
// Modifier matching is a flat run of guard comparisons (mod / alt / shift /
// cross-platform exclusion); each early return is one rule of the chord
// grammar, and extracting them would obscure the contract.
function eventMatchesChord(event: KeyboardEvent, chord: string): boolean {
  const parts = chord.split('+');
  const key = parts.at(-1) ?? '';
  // A plain array, not a `Set`: a chord carries at most three modifiers, so
  // three `includes` scans beat building a hashed collection on every
  // keystroke.
  const modifiers = parts.slice(0, -1);

  const wantsMod = modifiers.includes('$mod');
  const wantsAlt = modifiers.includes('alt');
  const wantsShift = modifiers.includes('shift');

  const apple = isApplePlatform();
  const modPressed = apple ? event.metaKey : event.ctrlKey;
  // The non-$mod modifier must not also be held, so e.g. Ctrl+K on macOS
  // doesn't trigger a ⌘K hotkey.
  const otherModPressed = apple ? event.ctrlKey : event.metaKey;

  if (wantsMod !== modPressed || otherModPressed) return false;
  if (wantsAlt !== event.altKey) return false;
  if (wantsShift && !event.shiftKey) return false;
  return event.key.toLowerCase() === key.toLowerCase();
}

/** Whether an event carries a chord modifier (⌘ / Ctrl / Alt). */
export function hasChordModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

/**
 * Whether an event's key can participate in a sequence: a single printable
 * character pressed without chord modifiers.
 */
export function isSequenceKey(event: KeyboardEvent): boolean {
  return !hasChordModifier(event) && event.key.length === 1;
}

/**
 * Find the action whose modifier chord matches the event. `actions` must
 * already be in precedence order (page before global, later registrations
 * first).
 */
export function matchChord(
  event: KeyboardEvent,
  actions: readonly RegisteredAction[],
): CommandAction | undefined {
  return actions.find(
    ({ action }) =>
      typeof action.trigger === 'string' &&
      action.trigger.includes('+') &&
      eventMatchesChord(event, action.trigger),
  )?.action;
}

export interface SequenceMatch {
  /** The action whose sequence the buffer completes, if any. */
  exact: CommandAction | undefined;
  /** Whether the buffer is a strict prefix of at least one sequence. */
  isPrefix: boolean;
}

/**
 * Match a candidate key buffer against the active plain-key triggers.
 * `actions` must already be in precedence order.
 */
// A single-pass scan that classifies every trigger as exact-match / prefix /
// miss in one loop; splitting it into separate passes would be simpler per
// function but iterate the registrations three times per keystroke.
export function matchSequence(
  buffer: readonly string[],
  actions: readonly RegisteredAction[],
): SequenceMatch {
  return actions.reduce<SequenceMatch>(
    (match, { action }) => {
      const trigger = action.trigger;
      if (trigger === undefined) return match;
      const sequence = asSequence(trigger);
      if (sequence === undefined) return match;

      if (sequence.length === buffer.length) {
        return match.exact === undefined && sequence.every((key, i) => key === buffer[i])
          ? { ...match, exact: action }
          : match;
      }
      return sequence.length > buffer.length && buffer.every((key, i) => key === sequence[i])
        ? { ...match, isPrefix: true }
        : match;
    },
    { exact: undefined, isPrefix: false },
  );
}

export interface TriggerDisplay {
  /**
   * Keys to render as `<kbd>` chips, in order. `'$mod'` is left un-resolved
   * so the rendering component can substitute the platform-appropriate
   * label.
   */
  keys: readonly string[];
  /** True when keys are pressed one after another rather than held together. */
  sequential: boolean;
}

/** Project a trigger into its display form for help overlays and badges. */
export function triggerDisplay(trigger: HotkeyTrigger): TriggerDisplay {
  if (typeof trigger === 'string') {
    if (isModifierChord(trigger)) {
      return {
        keys: trigger.split('+').map((part) => (part === '$mod' ? part : part.toUpperCase())),
        sequential: false,
      };
    }
    return { keys: [trigger.toUpperCase()], sequential: false };
  }
  return { keys: trigger.map((key) => key.toUpperCase()), sequential: true };
}
