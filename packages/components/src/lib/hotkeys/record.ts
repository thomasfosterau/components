/**
 * Recording a shortcut from a key press, and naming one for people: the
 * pieces `HotkeyInput` is made of. Chords are written in the registry's own
 * grammar (`'$mod+shift+k'`), so a recorded value can be bound directly.
 *
 * @module
 */

import type { HotkeyChord, HotkeyTrigger } from './types.ts';

/** Browser and OS shortcuts a page should not take, in registry syntax. */
export const defaultReservedHotkeys: readonly HotkeyChord[] = [
  '$mod+w',
  '$mod+t',
  '$mod+n',
  '$mod+q',
  '$mod+l',
  '$mod+r',
  '$mod+shift+t',
  '$mod+shift+n',
  '$mod+shift+w',
];

const MODIFIER_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'AltGraph',
  'CapsLock',
  'Fn',
  'OS',
]);

/** Whether the key pressed is only a modifier, so the chord is not finished yet. */
export const isModifierOnly = (event: KeyboardEvent): boolean => MODIFIER_KEYS.has(event.key);

/**
 * The key part of a chord. With Alt or the platform modifier held, `key` is
 * often a composed character (Alt+K is `˚` on a Mac), so letters and digits
 * come from the physical `code`.
 */
function keyOf(event: KeyboardEvent, modified: boolean): string {
  const physical = /^Key([A-Z])$|^Digit(\d)$/.exec(event.code);
  if (modified && physical) return (physical[1] ?? physical[2] ?? '').toLowerCase();
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

/**
 * The chord a key press makes, in registry syntax: `'$mod+shift+k'`, `'alt+1'`,
 * or a plain key (`'g'`, `'?'`). `undefined` while only modifiers are down.
 * Shift is written only alongside another modifier: on its own, the shifted
 * character (`?`) already says it.
 */
export function chordOf(event: KeyboardEvent, apple: boolean): HotkeyChord | undefined {
  if (isModifierOnly(event)) return undefined;
  const mod = apple ? event.metaKey : event.ctrlKey;
  const modified = mod || event.altKey;
  const parts = [
    ...(mod ? ['$mod'] : []),
    ...(event.altKey ? ['alt'] : []),
    ...(modified && event.shiftKey ? ['shift'] : []),
  ];
  const key = keyOf(event, modified);
  return modified ? [...parts, key].join('+') : event.key.length === 1 ? event.key : key;
}

/** Whether a chord holds `$mod` or Alt. */
export const hasModifier = (chord: HotkeyChord): boolean =>
  chord.split('+').some((part) => part === '$mod' || part === 'alt');

/** How to name each part of a chord, on screen and aloud. */
export interface ChordNames {
  readonly mod: string;
  readonly alt: string;
  readonly shift: string;
}

/** On-screen names: glyphs on Apple platforms, words elsewhere. */
export const shownChordNames = (apple: boolean): ChordNames =>
  apple ? { mod: '⌘', alt: '⌥', shift: '⇧' } : { mod: 'Ctrl', alt: 'Alt', shift: 'Shift' };

/** Spoken names, for the description a screen reader reads. */
export const spokenChordNames = (apple: boolean): ChordNames =>
  apple
    ? { mod: 'Command', alt: 'Option', shift: 'Shift' }
    : { mod: 'Control', alt: 'Alt', shift: 'Shift' };

const SPECIAL_KEYS: Readonly<Record<string, string>> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
};

/** The parts of a chord as names: `['⌘', '⇧', 'K']` or `['Control', 'Shift', 'K']`. */
export function chordParts(chord: HotkeyChord, names: ChordNames): string[] {
  const parts = chord.split('+');
  const key = parts.at(-1) ?? '';
  const modifiers = parts
    .slice(0, -1)
    .map((part) => names[part === '$mod' ? 'mod' : part === 'alt' ? 'alt' : 'shift']);
  return [...modifiers, SPECIAL_KEYS[key] ?? (key.length === 1 ? key.toUpperCase() : key)];
}

/**
 * A trigger as text: a chord's parts joined by `join`, a sequence's chords
 * joined by `then` (`'G then P'`).
 */
export const triggerText = (
  trigger: HotkeyTrigger,
  names: ChordNames,
  join: string,
  then: string,
): string =>
  (typeof trigger === 'string' ? [trigger] : trigger)
    .map((chord) => chordParts(chord, names).join(join))
    .join(` ${then} `);
