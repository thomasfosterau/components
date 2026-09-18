<!-- A miniature app: a registry, the global key listener, the help overlay, a
     few registered actions and a text input to type into. It is what the
     `HotkeyProvider` and `HotkeyHelpDialog` tests press keys against — every
     fired action appends its id to a list the test reads, so "did this
     keystroke fire that action" is a DOM assertion rather than a spy. -->
<script lang="ts">
  import {
    createHotkeyRegistry,
    registerHotkeys,
  } from '../../../src/lib/hotkeys/context.svelte.ts';
  import HotkeyHelpDialog from '../../../src/lib/hotkeys/HotkeyHelpDialog.svelte';
  import HotkeyProvider from '../../../src/lib/hotkeys/HotkeyProvider.svelte';
  import type { CommandAction } from '../../../src/lib/hotkeys/types.ts';

  interface Props {
    isAdmin?: boolean;
    /** When false the page registers nothing, leaving only the global section. */
    withPageActions?: boolean;
    /** When false nothing global is registered either — the empty help overlay. */
    withGlobalActions?: boolean;
    helpTitle?: string | undefined;
    emptyLabel?: string | undefined;
    groupLabels?: { page: string; global: string } | undefined;
  }

  let {
    isAdmin = true,
    withPageActions = true,
    withGlobalActions = true,
    helpTitle,
    emptyLabel,
    groupLabels,
  }: Props = $props();

  const registry = createHotkeyRegistry({ isAdmin: () => isAdmin });

  let fired = $state<string[]>([]);
  const fire = (id: string) => () => {
    fired = [...fired, id];
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
        fire('palette.toggle')();
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
    {
      id: 'admin.publish',
      label: 'Publish everything',
      group: 'actions',
      trigger: 'a',
      requiresAdmin: true,
      run: fire('admin.publish'),
    },
  ];

  const pageActions: readonly CommandAction[] = [
    { id: 'post.edit', label: 'Edit post', group: 'actions', trigger: 'e', run: fire('post.edit') },
    {
      id: 'nav.posts',
      label: 'Go to posts',
      group: 'navigation',
      trigger: ['g', 'p'],
      run: fire('nav.posts'),
    },
  ];

  registerHotkeys(() => (withGlobalActions ? globalActions : []), { scope: 'global' });
  registerHotkeys(() => (withPageActions ? pageActions : []));
</script>

<label>
  Note
  <input type="text" name="note" />
</label>

<button type="button" onclick={() => (registry.helpOpen = true)}>Open help</button>

<ul data-testid="fired">
  {#each fired as id, index (index)}
    <li data-testid="fired-id">{id}</li>
  {/each}
</ul>
<p data-testid="palette-open">{registry.paletteOpen ? 'open' : 'closed'}</p>

<HotkeyProvider />
<HotkeyHelpDialog title={helpTitle} {emptyLabel} {groupLabels} />
