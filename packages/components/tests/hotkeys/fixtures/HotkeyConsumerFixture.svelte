<!-- Child half of `HotkeyProviderFixture`. Resolves the registry from context
     with `getHotkeyRegistry()` (proving the context key round-trips),
     registers a page-scoped action (and optionally an admin-only one) through
     `registerHotkeys()`, and renders the registry's role-filtered `active`
     ids so the test can assert what the viewer can see. -->
<script lang="ts">
  import {
    getHotkeyRegistry,
    registerHotkeys,
  } from '../../../src/lib/hotkeys/context.svelte.ts';
  import type { HotkeyRegistry } from '../../../src/lib/hotkeys/registry.svelte.ts';
  import type { CommandAction } from '../../../src/lib/hotkeys/types.ts';

  interface Props {
    /** Passed only so the test can assert it is the instance context resolves. */
    registry: HotkeyRegistry;
    withAdminAction?: boolean;
  }

  let { registry, withAdminAction = false }: Props = $props();

  // Resolve from context — this is the call under test.
  const resolved = getHotkeyRegistry();
  // `$derived`, not a bare `===`, so reading the `registry` prop does not trip
  // Svelte's "reference only captures the initial value" warning.
  const sameInstance = $derived(resolved === registry);

  registerHotkeys(() => {
    const actions: CommandAction[] = [
      { id: 'page.action', label: 'Page', run: () => {}, group: 'actions', trigger: 'e' },
    ];
    if (withAdminAction) {
      actions.push({
        id: 'page.admin',
        label: 'Admin',
        run: () => {},
        group: 'actions',
        requiresAdmin: true,
      });
    }
    return actions;
  });
</script>

<div data-testid="same-instance">{sameInstance}</div>
<ul data-testid="active">
  {#each resolved.active as entry (entry.action.id)}
    <li data-testid="active-id">{entry.action.id}</li>
  {/each}
</ul>
