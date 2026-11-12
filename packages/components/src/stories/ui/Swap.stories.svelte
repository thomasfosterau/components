<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Pause, Play, Star } from '@lucide/svelte';
  import Swap from '../../lib/ui/Swap.svelte';
  import ToggleButton from '../../lib/ui/ToggleButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/Swap',
    component: Swap,
    parameters: {
      docs: {
        description: {
          component:
            "daisyUI's `swap`, display only: `active` picks the face. It has no input, role or name — put it inside the control that owns the state (here a `ToggleButton`, whose `aria-pressed` announces it). `ThemeToggle`'s sun / moon is a `Swap`.",
        },
      },
    },
  });
</script>

<script lang="ts">
  let playing = $state(false);
</script>

{#snippet play()}<Play class="size-5" />{/snippet}
{#snippet pause()}<Pause class="size-5" />{/snippet}
{#snippet outline()}<Star class="size-5" />{/snippet}
{#snippet filled()}<Star class="size-5 fill-current" />{/snippet}

<Story name="Effects">
  <div class="flex items-center gap-6">
    <Swap active={false} off={play} on={pause} />
    <Swap active effect="rotate" off={play} on={pause} />
    <Swap active effect="flip" off={outline} on={filled} />
  </div>
</Story>

<Story name="Inside the control that owns the state">
  <ToggleButton label="Play recording" iconOnly bind:pressed={playing}>
    {#snippet icon()}<Swap active={playing} effect="rotate" off={play} on={pause} />{/snippet}
  </ToggleButton>
</Story>
