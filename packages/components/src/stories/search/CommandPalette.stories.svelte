<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import CommandPalette from '../../lib/search/CommandPalette.svelte';
  import HotkeyDemo from '../hotkeys/HotkeyDemo.svelte';
  import PaletteDemo from './PaletteDemo.svelte';

  const { Story } = defineMeta({
    title: 'Search/CommandPalette',
    component: CommandPalette,
    parameters: {
      docs: {
        description: {
          component:
            'bits-ui’s `Command` inside this library’s `Dialog`. With a hotkey registry above it, the rows are the registry’s palette actions (role-filtered there, each showing its trigger) and the open state is the registry’s `paletteOpen`, so the registered ⌘K action opens it. With no registry, `items` and `onSearch` are the whole source — which is the configuration an app without a hotkey system gets. `shouldFilter` is off exactly when `onSearch` is given, because async rows are already the server’s answer to the query.',
        },
      },
    },
  });
</script>

<Story name="From the hotkey registry (press Cmd+K or Ctrl+K)">
  <HotkeyDemo>
    <CommandPalette />
  </HotkeyDemo>
</Story>

<Story name="A non-admin viewer sees fewer rows">
  <HotkeyDemo isAdmin={false}>
    <CommandPalette />
  </HotkeyDemo>
</Story>

<Story name="No registry: static rows and an async search">
  <PaletteDemo />
</Story>

<Story name="No registry, no search: bits-ui does the filtering">
  <PaletteDemo withSearch={false} />
</Story>

<Story name="Every string is a prop">
  <HotkeyDemo>
    <CommandPalette
      label="Palette de commandes"
      placeholder="Tapez une commande…"
      loadingLabel="Recherche…"
      emptyLabel="Aucun résultat"
      closeLabel="Fermer"
      groups={[
        { id: 'actions', label: 'Actions' },
        { id: 'navigation', label: 'Aller à' },
        { id: 'results', label: 'Résultats' },
      ]}
    />
  </HotkeyDemo>
</Story>
