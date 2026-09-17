/**
 * `HotkeyRegistry` — the single source of truth for "what can the viewer do
 * right now". Pages and the global shell `register()` batches of actions, and
 * three `$derived` surfaces project them: `active` (match precedence),
 * `paletteActions` (palette order) and `hotkeys` (the help overlay). Pinned
 * here:
 *
 * - registration accumulates into `active`, page scope before global and
 *   later registrations first within a scope;
 * - role gating — `requiresAdmin` drops an action from every surface for a
 *   non-admin viewer, reactively;
 * - `paletteActions` drops `paletteVisible: false`; `hotkeys` keeps only
 *   actions carrying a trigger; both in registration order;
 * - **unregister removes by the stable monotonic `order`, not identity.**
 *   `$state` deep-proxies the registration array, so entries read back are
 *   proxies that never `===` the raw objects the closure captured; an
 *   identity `Set` removed nothing and leaked the batch on every reactive
 *   re-registration. The last two tests would catch that regression.
 *
 * The read surfaces only re-evaluate inside a reactive scope, so the registry
 * runs under `$effect.root` with each `$derived` mirrored into a plain array
 * and `flushSync()` after every mutation — hence the `.svelte.test.ts`
 * extension: runes are a compiler feature, unavailable in a plain `.test.ts`.
 */

import { flushSync } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import { HotkeyRegistry } from '../../src/lib/hotkeys/registry.svelte.ts';
import type { CommandAction } from '../../src/lib/hotkeys/types.ts';

/** A minimal action; only the fields a test asserts on need to vary. */
function action(id: string, extra: Partial<CommandAction> = {}): CommandAction {
  return { id, label: id, run: () => {}, group: 'actions', ...extra };
}

/**
 * Drive a registry under a reactive root, mirroring each read surface into an
 * array the test can assert on.
 */
function withRegistry(
  isAdmin: () => boolean,
  body: (api: {
    registry: HotkeyRegistry;
    flush: () => void;
    activeIds: () => string[];
    paletteIds: () => string[];
    hotkeyIds: () => string[];
  }) => void,
  options: { dev?: boolean } = {},
): void {
  let registry!: HotkeyRegistry;
  const mirror = { active: [] as string[], palette: [] as string[], hotkeys: [] as string[] };
  const cleanup = $effect.root(() => {
    registry = new HotkeyRegistry({ isAdmin, dev: options.dev });
    $effect(() => {
      mirror.active = registry.active.map((entry) => entry.action.id);
    });
    $effect(() => {
      mirror.palette = registry.paletteActions.map((entry) => entry.action.id);
    });
    $effect(() => {
      mirror.hotkeys = registry.hotkeys.map((entry) => entry.action.id);
    });
  });
  flushSync();
  try {
    body({
      registry,
      flush: () => flushSync(),
      activeIds: () => mirror.active,
      paletteIds: () => mirror.palette,
      hotkeyIds: () => mirror.hotkeys,
    });
  } finally {
    cleanup();
  }
}

describe('register / active', () => {
  test('starts empty', () => {
    withRegistry(
      () => true,
      ({ activeIds }) => expect(activeIds()).toEqual([]),
    );
  });

  test('surfaces a registered batch, later registrations first within a scope', () => {
    withRegistry(
      () => true,
      ({ registry, flush, activeIds }) => {
        registry.register('page', [action('a'), action('b')]);
        flush();
        expect(activeIds()).toEqual(['b', 'a']);
      },
    );
  });

  test('orders page scope before global', () => {
    withRegistry(
      () => true,
      ({ registry, flush, activeIds }) => {
        registry.register('global', [action('g1')]);
        registry.register('global', [action('g2')]);
        registry.register('page', [action('p1')]);
        registry.register('page', [action('p2')]);
        flush();
        expect(activeIds()).toEqual(['p2', 'p1', 'g2', 'g1']);
      },
    );
  });
});

describe('role gating', () => {
  test('drops requiresAdmin actions from every surface for a non-admin viewer', () => {
    withRegistry(
      () => false,
      ({ registry, flush, activeIds, paletteIds, hotkeyIds }) => {
        registry.register('page', [
          action('public', { trigger: 'p' }),
          action('admin-only', { requiresAdmin: true, trigger: 'a' }),
        ]);
        flush();
        expect(activeIds()).toEqual(['public']);
        expect(paletteIds()).toEqual(['public']);
        expect(hotkeyIds()).toEqual(['public']);
      },
    );
  });

  test('re-derives reactively when the admin signal flips', () => {
    let admin = $state(false);
    let registry!: HotkeyRegistry;
    let activeIds: string[] = [];
    const cleanup = $effect.root(() => {
      registry = new HotkeyRegistry({ isAdmin: () => admin });
      $effect(() => {
        activeIds = registry.active.map((entry) => entry.action.id);
      });
    });
    flushSync();
    registry.register('page', [action('admin-only', { requiresAdmin: true })]);
    flushSync();
    expect(activeIds).toEqual([]);

    admin = true;
    flushSync();
    expect(activeIds).toEqual(['admin-only']);
    cleanup();
  });
});

describe('paletteActions / hotkeys', () => {
  test('paletteActions excludes paletteVisible:false and keeps registration order', () => {
    withRegistry(
      () => true,
      ({ registry, flush, paletteIds }) => {
        registry.register('page', [
          action('shown-1'),
          action('hidden', { paletteVisible: false }),
          action('shown-2'),
        ]);
        flush();
        expect(paletteIds()).toEqual(['shown-1', 'shown-2']);
      },
    );
  });

  test('hotkeys keeps only actions that carry a trigger, in registration order', () => {
    withRegistry(
      () => true,
      ({ registry, flush, hotkeyIds }) => {
        registry.register('page', [
          action('with-trigger', { trigger: 'e' }),
          action('palette-only'),
          action('with-sequence', { trigger: ['g', 'p'] }),
        ]);
        flush();
        expect(hotkeyIds()).toEqual(['with-trigger', 'with-sequence']);
      },
    );
  });
});

describe('the trigger-conflict warning', () => {
  test('stays silent by default, because `dev` defaults to false', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    withRegistry(
      () => true,
      ({ registry, flush }) => {
        registry.register('global', [action('first', { trigger: '$mod+k' })]);
        registry.register('page', [action('second', { trigger: '$mod+k' })]);
        flush();
      },
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test('warns in a dev build when a later batch shadows an existing trigger', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    withRegistry(
      () => true,
      ({ registry, flush }) => {
        registry.register('global', [action('first', { trigger: '$mod+k' })]);
        registry.register('page', [action('second', { trigger: '$mod+k' })]);
        flush();
      },
      { dev: true },
    );
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain('[hotkeys]');
    expect(message).toContain('second');
    expect(message).toContain('first');
    warn.mockRestore();
  });

  test('warns on a shadowed sequence trigger, and stays silent when nothing collides', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    withRegistry(
      () => true,
      ({ registry, flush }) => {
        registry.register('global', [action('nav', { trigger: ['g', 'p'] })]);
        registry.register('page', [action('dup', { trigger: ['g', 'p'] })]);
        flush();
      },
      { dev: true },
    );
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockClear();

    withRegistry(
      () => true,
      ({ registry, flush }) => {
        registry.register('global', [action('a', { trigger: 'e' })]);
        // `c` carries no trigger at all — the conflict scan skips it.
        registry.register('page', [action('b', { trigger: 'n' }), action('c')]);
        flush();
      },
      { dev: true },
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('the unregister closure', () => {
  test('removes its batch from every read surface', () => {
    withRegistry(
      () => true,
      ({ registry, flush, activeIds }) => {
        const off = registry.register('page', [action('ephemeral')]);
        flush();
        expect(activeIds()).toEqual(['ephemeral']);
        off();
        flush();
        expect(activeIds()).toEqual([]);
      },
    );
  });

  test('removes only its own batch, leaving other registrations intact', () => {
    withRegistry(
      () => true,
      ({ registry, flush, activeIds }) => {
        const offFirst = registry.register('page', [action('first')]);
        registry.register('page', [action('second')]);
        flush();
        expect(activeIds()).toEqual(['second', 'first']);
        offFirst();
        flush();
        expect(activeIds()).toEqual(['second']);
      },
    );
  });
});
