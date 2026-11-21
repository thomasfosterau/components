<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HotkeyEditor from '../../lib/hotkeys/HotkeyEditor.svelte';
  import HotkeyHelpDialog from '../../lib/hotkeys/HotkeyHelpDialog.svelte';
  import HotkeyDemo from './HotkeyDemo.svelte';

  const { Story } = defineMeta({
    title: 'Hotkeys/HotkeyEditor',
    component: HotkeyEditor,
    parameters: {
      docs: {
        description: {
          component:
            "Every registered command and its shortcut. Record a new one, disable or reset it, or switch off all single-key shortcuts (WCAG 2.1.4). Changes go straight to the registry, so the help dialog (?) and the commands' own keys follow.",
        },
      },
    },
  });
</script>

<Story name="Settings page" asChild>
  <HotkeyDemo>
    <HotkeyEditor class="max-w-2xl" />
    <HotkeyHelpDialog />
  </HotkeyDemo>
</Story>
