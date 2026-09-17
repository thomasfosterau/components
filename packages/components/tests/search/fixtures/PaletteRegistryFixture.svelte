<!-- The palette as an app wires it: a registry, the global key listener, and
     `CommandPalette` with no `items` of its own — every row comes from
     `registerHotkeys`. The `$mod+k` action is what opens it, so the test
     exercises the registry → provider → palette path rather than poking
     `open` directly. Selected ids land in a list the test reads. -->
<script lang="ts">
  import {
    createHotkeyRegistry,
    registerHotkeys,
  } from '../../../src/lib/hotkeys/context.svelte.ts';
  import HotkeyProvider from '../../../src/lib/hotkeys/HotkeyProvider.svelte';
  import CommandPalette from '../../../src/lib/search/CommandPalette.svelte';

  interface Props {
    isAdmin?: boolean;
    label?: string | undefined;
  }

  let { isAdmin = true, label }: Props = $props();

  const registry = createHotkeyRegistry({ isAdmin: () => isAdmin });

  let ran = $state<string[]>([]);
  const run = (id: string) => () => {
    ran = [...ran, id];
  };

  registerHotkeys(
    () => [
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
      { id: 'post.create', label: 'New post', group: 'actions', trigger: 'c', run: run('post.create') },
      { id: 'post.edit', label: 'Edit post', group: 'actions', trigger: 'e', run: run('post.edit') },
      { id: 'nav.posts', label: 'Go to posts', group: 'navigation', run: run('nav.posts') },
      {
        id: 'admin.purge',
        label: 'Purge the cache',
        group: 'actions',
        requiresAdmin: true,
        run: run('admin.purge'),
      },
    ],
    { scope: 'global' },
  );
</script>

<ul data-testid="ran">
  {#each ran as id, index (index)}
    <li data-testid="ran-id">{id}</li>
  {/each}
</ul>
<p data-testid="palette-open">{registry.paletteOpen ? 'open' : 'closed'}</p>

<HotkeyProvider />
<CommandPalette {label} />
