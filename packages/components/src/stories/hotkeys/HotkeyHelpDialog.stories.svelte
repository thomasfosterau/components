<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HotkeyHelpDialog from '../../lib/hotkeys/HotkeyHelpDialog.svelte';
  import HotkeyDemo from './HotkeyDemo.svelte';

  const { Story } = defineMeta({
    title: 'Hotkeys/HotkeyHelpDialog',
    component: HotkeyHelpDialog,
    parameters: {
      docs: {
        description: {
          component:
            'The `?` overlay, on this library’s `Dialog`. It lists what the registry holds for the current viewer — page registrations under one heading, global ones under the other, admin-only actions absent unless the viewer is an admin — so it can never drift from what `HotkeyProvider` would actually match. Click the story, then press `?`.',
        },
      },
    },
  });
</script>

<Story name="Opened with ?">
  <HotkeyDemo>
    <HotkeyHelpDialog />
  </HotkeyDemo>
</Story>

<Story name="A non-admin viewer">
  <HotkeyDemo isAdmin={false}>
    <HotkeyHelpDialog />
  </HotkeyDemo>
</Story>

<Story name="Every string is a prop">
  <HotkeyDemo>
    <HotkeyHelpDialog
      title="Raccourcis clavier"
      closeLabel="Fermer"
      emptyLabel="Aucun raccourci ici"
      groupLabels={{ page: 'Cette page', global: 'Partout' }}
      commandLabel="Cmd"
      controlLabel="Ctrl"
      thenLabel="puis"
    />
  </HotkeyDemo>
</Story>
