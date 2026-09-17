/**
 * Svelte context plumbing for the hotkey registry, plus the declarative
 * `registerHotkeys` helper that pages and shared page components call to
 * contribute page-scoped actions.
 *
 * @module
 */

import { getContext, setContext, untrack } from 'svelte';
import { HotkeyRegistry, type HotkeyRegistryOptions } from './registry.svelte.ts';
import type { CommandAction, HotkeyScope } from './types.ts';

const CONTEXT_KEY = Symbol('@thomasfosterau/components:hotkey-registry');

/** Raised by {@link getHotkeyRegistry} when no registry has been created above. */
export class HotkeyRegistryMissing extends Error {
  override readonly name = 'HotkeyRegistryMissing';
}

/**
 * Create the registry and place it in context. Call once, from the root
 * layout, during component initialisation.
 */
export function createHotkeyRegistry(options: HotkeyRegistryOptions): HotkeyRegistry {
  const registry = new HotkeyRegistry(options);
  setContext(CONTEXT_KEY, registry);
  return registry;
}

/**
 * Read the registry from context, or `undefined` when none was created.
 *
 * This is the seam that lets `CommandPalette` work in an app that never
 * mounted a registry: it falls back to its `items` prop. Components that
 * cannot work without one (`HotkeyProvider`, `HotkeyHelpDialog`) call
 * {@link getHotkeyRegistry} instead, so the failure is loud.
 */
export function tryGetHotkeyRegistry(): HotkeyRegistry | undefined {
  return getContext<HotkeyRegistry | undefined>(CONTEXT_KEY);
}

/** Read the registry from context. Throws when none was created. */
export function getHotkeyRegistry(): HotkeyRegistry {
  const registry = tryGetHotkeyRegistry();
  if (!registry) {
    throw new HotkeyRegistryMissing(
      'HotkeyRegistry not found in context. ' +
        'createHotkeyRegistry() must be called by an ancestor (the root layout).',
    );
  }
  return registry;
}

/**
 * Declaratively register actions for the lifetime of the calling component.
 * Registration is reactive: the `actions` thunk re-runs when its dependencies
 * change (a resource's `canEdit` resolving, say), replacing the previous
 * registration.
 *
 * ```svelte
 * registerHotkeys(() =>
 *   post.canEdit
 *     ? [{ id: 'post.edit', label: 'Edit post', trigger: 'e', group: 'actions',
 *          run: () => goto(`/posts/${post.id}/edit`) }]
 *     : [],
 * );
 * ```
 */
export function registerHotkeys(
  actions: () => readonly CommandAction[],
  options: { scope?: HotkeyScope | undefined } = {},
): void {
  const registry = getHotkeyRegistry();
  const scope = options.scope ?? 'page';
  $effect(() => {
    // Track only the `actions` thunk's own reactive inputs. `register()`
    // reads *and* writes the registry's `#registrations` `$state`; left
    // tracked, that read-then-write makes the effect re-trigger itself
    // forever (`effect_update_depth_exceeded`, which crashed hydration on
    // every page). `untrack` isolates the register call so the effect re-runs
    // only when `actions()` changes, not when the array it writes does.
    const batch = actions();
    return untrack(() => registry.register(scope, batch));
  });
}
