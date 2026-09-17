/**
 * The pure matching helpers — the rules `HotkeyProvider` leans on: platform
 * `$mod` resolution, editable-target detection, chord matching, the sequence
 * buffer matcher (exact / prefix / miss), and the display projection the
 * badges and the help overlay render. No Svelte, no DOM mutation, so they
 * exercise the trigger grammar directly.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  hasChordModifier,
  isApplePlatform,
  isEditableTarget,
  isSequenceKey,
  matchChord,
  matchSequence,
  triggerDisplay,
} from '../../src/lib/hotkeys/match.ts';
import type {
  CommandAction,
  HotkeyTrigger,
  RegisteredAction,
} from '../../src/lib/hotkeys/types.ts';

/** Build a registration around a trigger; only `trigger` matters for matching. */
function reg(
  trigger: HotkeyTrigger | undefined,
  scope: 'global' | 'page' = 'global',
): RegisteredAction {
  const action: CommandAction = {
    id: `action-${String(trigger)}`,
    label: String(trigger),
    run: () => {},
    group: 'actions',
    trigger,
  };
  return { scope, action };
}

// `navigator.platform` is read per `isApplePlatform()` call; stub it so the
// cross-platform `$mod` rules can be exercised both ways, and put it back
// afterwards (it lives on the prototype, so "back" means deleting the own
// property this defines).
function setPlatform(value: string): void {
  Object.defineProperty(globalThis.navigator, 'platform', { value, configurable: true });
}
afterEach(() => {
  Reflect.deleteProperty(globalThis.navigator, 'platform');
});

describe('isApplePlatform', () => {
  test('is true on a Mac platform string', () => {
    setPlatform('MacIntel');
    expect(isApplePlatform()).toBe(true);
  });

  test('is true on iOS platform strings', () => {
    for (const platform of ['iPhone', 'iPad', 'iPod']) {
      setPlatform(platform);
      expect(isApplePlatform()).toBe(true);
    }
  });

  test('is false on non-Apple platforms', () => {
    setPlatform('Win32');
    expect(isApplePlatform()).toBe(false);
    setPlatform('Linux x86_64');
    expect(isApplePlatform()).toBe(false);
  });
});

describe('isEditableTarget', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  test('is false for no target and for non-elements', () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(document.createTextNode('x') as unknown as EventTarget)).toBe(false);
  });

  test.each(['input', 'textarea', 'select'])('is true for a <%s>', (tag) => {
    expect(isEditableTarget(document.createElement(tag))).toBe(true);
  });

  test('is true for a contenteditable element', () => {
    const element = document.createElement('div');
    element.setAttribute('contenteditable', 'true');
    document.body.append(element);
    expect(isEditableTarget(element)).toBe(true);
  });

  test('is false for a plain non-editable element', () => {
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
  });
});

describe('hasChordModifier / isSequenceKey', () => {
  test('hasChordModifier reflects meta/ctrl/alt, and shift alone is not one', () => {
    expect(hasChordModifier(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))).toBe(true);
    expect(hasChordModifier(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))).toBe(true);
    expect(hasChordModifier(new KeyboardEvent('keydown', { key: 'k', altKey: true }))).toBe(true);
    expect(hasChordModifier(new KeyboardEvent('keydown', { key: 'k' }))).toBe(false);
    expect(hasChordModifier(new KeyboardEvent('keydown', { key: 'K', shiftKey: true }))).toBe(
      false,
    );
  });

  test('isSequenceKey is true only for a single printable key with no chord modifier', () => {
    expect(isSequenceKey(new KeyboardEvent('keydown', { key: 'g' }))).toBe(true);
    expect(isSequenceKey(new KeyboardEvent('keydown', { key: '/' }))).toBe(true);
    expect(isSequenceKey(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false);
    expect(isSequenceKey(new KeyboardEvent('keydown', { key: 'g', metaKey: true }))).toBe(false);
  });
});

describe('matchChord', () => {
  test('matches a $mod chord using ⌘ on Apple platforms', () => {
    setPlatform('MacIntel');
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    expect(matchChord(event, [reg('$mod+k')])?.id).toBe('action-$mod+k');
  });

  test('matches a $mod chord using Ctrl off Apple platforms', () => {
    setPlatform('Win32');
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    expect(matchChord(event, [reg('$mod+k')])?.id).toBe('action-$mod+k');
  });

  test('does not match when the cross-platform other modifier is also held', () => {
    setPlatform('MacIntel');
    // Ctrl+K on macOS must not fire a ⌘K hotkey.
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    expect(matchChord(event, [reg('$mod+k')])).toBeUndefined();
  });

  test('honours an explicit shift modifier', () => {
    setPlatform('Win32');
    const withShift = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, shiftKey: true });
    expect(matchChord(withShift, [reg('$mod+shift+k')])?.id).toBe('action-$mod+shift+k');
    const withoutShift = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    expect(matchChord(withoutShift, [reg('$mod+shift+k')])).toBeUndefined();
  });

  test('ignores plain-key and sequence triggers', () => {
    setPlatform('Win32');
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    expect(matchChord(event, [reg('k'), reg(['g', 'p'])])).toBeUndefined();
  });

  test('returns the first matching action in precedence order', () => {
    setPlatform('Win32');
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    const page = reg('$mod+k', 'page');
    const global = reg('$mod+k', 'global');
    expect(matchChord(event, [page, global])).toBe(page.action);
  });
});

describe('matchSequence', () => {
  const actions = [reg(['g', 'p']), reg('e'), reg('$mod+k')];

  test('reports an exact match when the buffer completes a sequence', () => {
    expect(matchSequence(['g', 'p'], actions).exact?.id).toBe('action-g,p');
    expect(matchSequence(['e'], actions).exact?.id).toBe('action-e');
  });

  test('reports a prefix when the buffer is a strict prefix of a longer sequence', () => {
    const result = matchSequence(['g'], actions);
    expect(result.exact).toBeUndefined();
    expect(result.isPrefix).toBe(true);
  });

  test('reports neither for an unrelated buffer', () => {
    const result = matchSequence(['z'], actions);
    expect(result.exact).toBeUndefined();
    expect(result.isPrefix).toBe(false);
  });

  test('skips chord triggers and actions with no trigger', () => {
    const result = matchSequence(['k'], [reg('$mod+k'), reg(undefined)]);
    expect(result.exact).toBeUndefined();
    expect(result.isPrefix).toBe(false);
  });
});

describe('triggerDisplay', () => {
  test('projects a modifier chord, leaving $mod unresolved and upper-casing the rest', () => {
    expect(triggerDisplay('$mod+k')).toEqual({ keys: ['$mod', 'K'], sequential: false });
  });

  test('projects a plain key as a single non-sequential chip', () => {
    expect(triggerDisplay('e')).toEqual({ keys: ['E'], sequential: false });
  });

  test('projects a sequence as ordered sequential chips', () => {
    expect(triggerDisplay(['g', 'p'])).toEqual({ keys: ['G', 'P'], sequential: true });
  });
});
