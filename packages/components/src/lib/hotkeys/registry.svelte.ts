/**
 * The reactive hotkey / command registry.
 *
 * One instance lives in the app's Svelte context. The root layout registers
 * `global` actions; pages register `page` actions that are torn down when the
 * page unmounts. The registry is the single source of truth for three
 * consumers:
 *
 * - `HotkeyProvider` — matches keyboard events against active triggers.
 * - `CommandPalette` — lists palette-visible actions.
 * - `HotkeyHelpDialog` — lists actions that carry triggers.
 *
 * Role gating happens here: actions registered with `requiresAdmin` are
 * dropped from every read surface when the viewer is not an administrator, so
 * non-admin users never see (or can fire) them.
 *
 * @module
 */

import type { CommandAction, HotkeyScope, HotkeyTrigger, RegisteredAction } from './types.ts';

/** What `createHotkeyRegistry` needs from the app: the admin check and the dev flag. */
export interface HotkeyRegistryOptions {
  /** Whether the current viewer is an administrator. Read lazily so it can be reactive. */
  isAdmin: () => boolean;
  /**
   * Whether this is a dev build. When true, registering a batch whose trigger
   * shadows an existing one logs a console warning. An app wires this to its
   * bundler's dev flag (SvelteKit's `$app/environment` `dev`); defaults to
   * `false`.
   */
  dev?: boolean | undefined;
}

interface Registration extends RegisteredAction {
  /** Monotonic insertion order — later registrations win trigger conflicts. */
  order: number;
}

/**
 * Whether two triggers denote the same keystroke. A structural comparison
 * rather than a JSON round-trip: a chord is a string and a sequence is an
 * array, so the two forms never collide.
 */
function sameTrigger(self: HotkeyTrigger, that: HotkeyTrigger): boolean {
  return typeof self === 'string' || typeof that === 'string'
    ? self === that
    : self.length === that.length && self.every((key, index) => key === that[index]);
}

/** A trigger rendered for the dev warning below. */
function formatTrigger(trigger: HotkeyTrigger): string {
  return typeof trigger === 'string' ? `"${trigger}"` : `["${trigger.join('", "')}"]`;
}

/** Dev-only console warning when a new registration shadows an existing trigger. */
function warnOnTriggerConflicts(
  added: readonly Registration[],
  existing: readonly Registration[],
): void {
  for (const entry of added) {
    const trigger = entry.action.trigger;
    if (trigger === undefined) continue;
    const conflict = existing.find(
      (other) => other.action.trigger !== undefined && sameTrigger(other.action.trigger, trigger),
    );
    if (conflict) {
      // A dev-build diagnostic: it has to reach the browser console the
      // developer is looking at, which is why this is the one `console` call
      // in the package.
      console.warn(
        `[hotkeys] Trigger ${formatTrigger(trigger)} of "${entry.action.id}" ` +
          `shadows "${conflict.action.id}" (${conflict.scope}). ` +
          `Page-scope and later registrations win.`,
      );
    }
  }
}

/** Page scope sorts before global scope. */
const scopeRank = (entry: Registration): number => (entry.scope === 'page' ? 0 : 1);

/**
 * Match precedence: page scope first, then the most recent registration.
 * A plain comparator — the composed `Order` this was ported from is the only
 * thing that changed.
 */
const byMatchPrecedence = (a: Registration, b: Registration): number =>
  scopeRank(a) - scopeRank(b) || b.order - a.order;

/** Ascending registration order (earlier registrations first). */
const byOrder = (a: Registration, b: Registration): number => a.order - b.order;

/** The reactive set of registered hotkey actions that `HotkeyProvider`, `CommandPalette` and `HotkeyHelpDialog` read; page registrations win over global ones. */
export class HotkeyRegistry {
  #registrations = $state<Registration[]>([]);
  #nextOrder = 0;
  readonly #isAdmin: () => boolean;
  readonly #dev: boolean;

  /** Whether the command palette is open. Bound by `CommandPalette`. */
  paletteOpen = $state(false);
  /** Whether the hotkey help overlay is open. Bound by `HotkeyHelpDialog`. */
  helpOpen = $state(false);

  constructor(options: HotkeyRegistryOptions) {
    this.#isAdmin = options.isAdmin;
    this.#dev = options.dev ?? false;
  }

  /**
   * Register a batch of actions under a scope. Returns an unregister
   * function; callers are expected to invoke it on unmount (the
   * `registerHotkeys` helper wires this to `$effect` cleanup).
   */
  register(scope: HotkeyScope, actions: readonly CommandAction[]): () => void {
    const added = actions.map((action) => ({ scope, action, order: this.#nextOrder++ }));

    if (this.#dev) warnOnTriggerConflicts(added, this.#registrations);

    this.#registrations = [...this.#registrations, ...added];
    return () => {
      // Remove by the stable monotonic `order`, NOT object identity. `$state`
      // deep-proxies `#registrations`, so entries read back here are proxies
      // that never `===` the raw objects captured in `added` — a `Set(added)`
      // membership test would match nothing and remove nothing, leaking the
      // batch. `registerHotkeys` wires this closure to `$effect` cleanup, so
      // every reactive re-registration would otherwise accumulate duplicates.
      const orders = new Set(added.map((entry) => entry.order));
      this.#registrations = this.#registrations.filter((entry) => !orders.has(entry.order));
    };
  }

  /**
   * Role-filtered active registrations in match-precedence order: page scope
   * before global, later registrations first within a scope.
   */
  readonly active: readonly RegisteredAction[] = $derived(
    this.#registrations
      .filter((entry) => !entry.action.requiresAdmin || this.#isAdmin())
      .toSorted(byMatchPrecedence),
  );

  /** Active actions that should appear in the command palette, in registration order. */
  readonly paletteActions: readonly RegisteredAction[] = $derived(
    this.#registrations
      .filter(
        (entry) =>
          (!entry.action.requiresAdmin || this.#isAdmin()) && entry.action.paletteVisible !== false,
      )
      .toSorted(byOrder),
  );

  /** Active actions that carry a keyboard trigger, for the help overlay. */
  readonly hotkeys: readonly RegisteredAction[] = $derived(
    this.#registrations
      .filter(
        (entry) =>
          (!entry.action.requiresAdmin || this.#isAdmin()) && entry.action.trigger !== undefined,
      )
      .toSorted(byOrder),
  );
}
