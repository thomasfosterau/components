<!-- Fixture for the hotkey context plumbing.

     Mounts a provider — `createHotkeyRegistry()` places the registry in Svelte
     context — then renders a child that reads it back with
     `getHotkeyRegistry()` and contributes a page-scoped action through
     `registerHotkeys()`. The child mirrors the registry's `active` ids into the
     DOM so the test can assert the provider → context → consumer round-trip
     without a keyboard.

     `isAdmin` is a prop so role gating can be exercised end-to-end through the
     context. -->
<script lang="ts">
  import {
    createHotkeyRegistry,
    registerHotkeys,
  } from '../../../src/lib/hotkeys/context.svelte.ts';
  import HotkeyConsumerFixture from './HotkeyConsumerFixture.svelte';

  interface Props {
    isAdmin?: boolean;
    /** When true the child also registers an admin-only action. */
    withAdminAction?: boolean;
  }

  let { isAdmin = true, withAdminAction = false }: Props = $props();

  // The provider owns the registry; the consumer reads it from context.
  const registry = createHotkeyRegistry({ isAdmin: () => isAdmin });

  // Provider-level (global) registration, mirroring a root layout.
  registerHotkeys(
    () => [{ id: 'global.action', label: 'Global', run: () => {}, group: 'actions' }],
    { scope: 'global' },
  );
</script>

<HotkeyConsumerFixture {registry} {withAdminAction} />
