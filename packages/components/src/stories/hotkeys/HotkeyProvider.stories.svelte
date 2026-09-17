<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HotkeyProvider from '../../lib/hotkeys/HotkeyProvider.svelte';
  import HotkeyHelpDialog from '../../lib/hotkeys/HotkeyHelpDialog.svelte';
  import HotkeyDemo from './HotkeyDemo.svelte';

  const { Story } = defineMeta({
    title: 'Hotkeys/HotkeyProvider',
    component: HotkeyProvider,
    parameters: {
      docs: {
        description: {
          component:
            'The single global `keydown` listener. It renders nothing, so what there is to see is behaviour: a plain key fires its action, `g` then `b` fires a sequence, and typing in the field below fires nothing at all — hotkeys stay inert while the reader is typing, except the palette opener, which is registered `allowInEditable`. The demo wrapper (Storybook only) provides the registry and the registrations.',
        },
      },
    },
  });
</script>

<Story name="Keys, sequences, and the editable guard">
  <HotkeyDemo>
    <label class="floating-label w-72">
      <span>Type here — the hotkeys go quiet</span>
      <input type="text" class="input w-full" placeholder="A note about this bed" />
    </label>
    <HotkeyHelpDialog />
  </HotkeyDemo>
</Story>
