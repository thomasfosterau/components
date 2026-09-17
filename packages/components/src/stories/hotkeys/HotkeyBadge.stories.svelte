<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HotkeyBadge from '../../lib/hotkeys/HotkeyBadge.svelte';

  const { Story } = defineMeta({
    title: 'Hotkeys/HotkeyBadge',
    component: HotkeyBadge,
    parameters: {
      docs: {
        description: {
          component:
            'A trigger rendered as daisyUI `kbd` chips. `$mod` resolves to ⌘ on Apple platforms and Ctrl everywhere else, and only AFTER mount — the server cannot know the platform, so server-rendered markup always says Ctrl and a Mac corrects itself on hydration. The separator between the keys of a sequence is real text (`thenLabel`), so “G then P” is announced as an instruction.',
        },
      },
    },
  });
</script>

<Story name="A modifier chord">
  <HotkeyBadge trigger="$mod+k" />
</Story>

<Story name="A plain key">
  <HotkeyBadge trigger="e" />
</Story>

<Story name="A sequence">
  <HotkeyBadge trigger={['g', 'p']} />
</Story>

<Story name="Shift in the chord">
  <HotkeyBadge trigger="$mod+shift+p" />
</Story>

<Story name="Every label is a prop">
  <div class="flex flex-col gap-2">
    <HotkeyBadge trigger="$mod+k" commandLabel="Cmd" controlLabel="Strg" />
    <HotkeyBadge trigger={['g', 'p']} thenLabel="puis" />
  </div>
</Story>

<Story name="In a row, as the palette and the help overlay use it">
  <ul class="divide-base-300 border-base-300 w-80 divide-y rounded border">
    <li class="flex items-center justify-between gap-4 px-3 py-2">
      <span class="text-sm">Open the command palette</span>
      <HotkeyBadge trigger="$mod+k" />
    </li>
    <li class="flex items-center justify-between gap-4 px-3 py-2">
      <span class="text-sm">Edit this bed</span>
      <HotkeyBadge trigger="e" />
    </li>
    <li class="flex items-center justify-between gap-4 px-3 py-2">
      <span class="text-sm">Go to plants</span>
      <HotkeyBadge trigger={['g', 'p']} />
    </li>
  </ul>
</Story>
