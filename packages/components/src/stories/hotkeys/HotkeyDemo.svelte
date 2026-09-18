<!--
  Storybook-only helper: creates a hotkey registry, registers a plausible set
  of global and page actions, mounts `HotkeyProvider` and shows what has
  fired — so a story can demonstrate `HotkeyHelpDialog` and `CommandPalette`
  against a live registry without repeating the setup. Lives outside
  `src/lib/`, so it never ships in `dist/`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    createHotkeyRegistry,
    registerHotkeys,
  } from '../../lib/hotkeys/context.svelte.ts';
  import HotkeyProvider from '../../lib/hotkeys/HotkeyProvider.svelte';
  import type { CommandAction } from '../../lib/hotkeys/types.ts';

  interface Props {
    /** Admin-only actions are dropped from every surface when this is false. */
    isAdmin?: boolean;
    children: Snippet<[]>;
  }

  let { isAdmin = true, children }: Props = $props();

  const registry = createHotkeyRegistry({ isAdmin: () => isAdmin });

  let log = $state<string[]>([]);
  const note = (text: string) => () => {
    log = [text, ...log].slice(0, 5);
  };

  const globalActions: readonly CommandAction[] = [
    {
      id: 'palette.toggle',
      label: 'Open the command palette',
      group: 'actions',
      trigger: '$mod+k',
      allowInEditable: true,
      paletteVisible: false,
      run: () => {
        registry.paletteOpen = !registry.paletteOpen;
      },
    },
    {
      id: 'help.show',
      label: 'Show keyboard shortcuts',
      group: 'actions',
      trigger: '?',
      run: () => {
        registry.helpOpen = true;
      },
    },
    { id: 'nav.beds', label: 'Go to beds', group: 'navigation', trigger: ['g', 'b'], run: note('Went to beds') },
    { id: 'nav.plants', label: 'Go to plants', group: 'navigation', trigger: ['g', 'p'], run: note('Went to plants') },
    {
      id: 'admin.reindex',
      label: 'Rebuild the search index',
      group: 'actions',
      requiresAdmin: true,
      run: note('Rebuilt the index'),
    },
  ];

  const pageActions: readonly CommandAction[] = [
    { id: 'bed.create', label: 'New bed', group: 'actions', trigger: 'c', run: note('Created a bed') },
    { id: 'bed.edit', label: 'Edit this bed', group: 'actions', trigger: 'e', run: note('Edited the bed') },
  ];

  registerHotkeys(() => globalActions, { scope: 'global' });
  registerHotkeys(() => pageActions);
</script>

<div class="flex flex-col gap-4 p-4">
  <p class="text-base-content/70 text-sm">
    Click here first, then press <kbd class="kbd kbd-sm">?</kbd>,
    <kbd class="kbd kbd-sm">C</kbd>, <kbd class="kbd kbd-sm">E</kbd>, or
    <kbd class="kbd kbd-sm">G</kbd> then <kbd class="kbd kbd-sm">B</kbd>.
  </p>

  {@render children()}

  {#if log.length > 0}
    <ul class="text-base-content/70 list-disc pl-5 text-sm">
      {#each log as entry, index (index)}
        <li>{entry}</li>
      {/each}
    </ul>
  {/if}
</div>

<HotkeyProvider />
