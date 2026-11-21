<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HotkeyInput from '../../lib/hotkeys/HotkeyInput.svelte';
  import HotkeyDemo from './HotkeyDemo.svelte';

  const { Story } = defineMeta({
    title: 'Hotkeys/HotkeyInput',
    component: HotkeyInput,
    parameters: {
      docs: {
        description: {
          component:
            'Focus the field and press a shortcut. Tab moves on, Escape drops a refused attempt and Backspace clears. Browser shortcuts such as Ctrl+W are refused; inside a registry, so is a chord another command holds, with a Replace button to take it over.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let value = $state<string | undefined>('$mod+shift+k');
</script>

<Story name="Standalone" asChild>
  <div class="flex w-72 flex-col gap-2">
    <label for="standalone-shortcut" class="text-sm font-medium">Quick capture</label>
    <HotkeyInput id="standalone-shortcut" bind:value />
  </div>
</Story>

<Story name="Single keys allowed" asChild>
  <div class="flex w-72 flex-col gap-2">
    <label for="single-shortcut" class="text-sm font-medium">Next item</label>
    <HotkeyInput id="single-shortcut" requireModifier={false} value="j" />
  </div>
</Story>

<Story name="Clash with a registered command" asChild>
  <HotkeyDemo>
    <div class="flex w-72 flex-col gap-2">
      <label for="clash-shortcut" class="text-sm font-medium">New shortcut (try Ctrl/⌘+K)</label>
      <HotkeyInput id="clash-shortcut" />
    </div>
  </HotkeyDemo>
</Story>
