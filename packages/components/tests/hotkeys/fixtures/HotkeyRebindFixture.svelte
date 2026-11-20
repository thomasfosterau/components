<!-- A registry with two commands, the provider, and either a lone HotkeyInput
     bound to `value` or the full HotkeyEditor, plus what has fired. -->
<script lang="ts">
  import HotkeyEditor from '../../../src/lib/hotkeys/HotkeyEditor.svelte';
  import HotkeyInput from '../../../src/lib/hotkeys/HotkeyInput.svelte';
  import HotkeyProvider from '../../../src/lib/hotkeys/HotkeyProvider.svelte';
  import { createHotkeyRegistry, registerHotkeys } from '../../../src/lib/hotkeys/context.svelte.ts';
  import type { HotkeyChord } from '../../../src/lib/hotkeys/types.ts';

  interface Props {
    editor?: boolean;
    requireModifier?: boolean;
    onOverridesChange?: (overrides: Readonly<Record<string, HotkeyChord | null>>) => void;
  }

  let { editor = false, requireModifier = true, onOverridesChange }: Props = $props();

  createHotkeyRegistry({ isAdmin: () => true, onOverridesChange: (next) => onOverridesChange?.(next) });
  let fired = $state<string[]>([]);
  let value = $state<HotkeyChord | undefined>();

  registerHotkeys(
    () => [
      { id: 'search', label: 'Search', group: 'actions', trigger: '$mod+k', allowInEditable: true, run: () => { fired = [...fired, 'search']; } },
      { id: 'archive', label: 'Archive', group: 'actions', trigger: 'e', run: () => { fired = [...fired, 'archive']; } },
      { id: 'posts', label: 'Go to posts', group: 'navigation', trigger: ['g', 'p'], run: () => { fired = [...fired, 'posts']; } },
    ],
    { scope: 'global' },
  );
</script>

<HotkeyProvider />
{#if editor}
  <HotkeyEditor />
{:else}
  <label for="shortcut">Shortcut</label>
  <HotkeyInput id="shortcut" bind:value {requireModifier} />
  <output data-testid="value">{value ?? ''}</output>
{/if}
<button type="button">After</button>
<p data-testid="fired">{fired.join(',')}</p>
