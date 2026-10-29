<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Star, VolumeX } from '@lucide/svelte';
  import ToggleButton from '../../lib/ui/ToggleButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/ToggleButton',
    component: ToggleButton,
    parameters: {
      docs: {
        description: {
          component:
            'A button that stays pressed (`aria-pressed`). Not a switch (`fields/Toggle`) and not a form value (`Checkbox`). The name never changes with state; pressed is a fill and `btn-active`, not colour alone.',
        },
      },
    },
  });
</script>

<Story name="Text">
  <ToggleButton>Show frost dates</ToggleButton>
</Story>

<Story name="Pressed icon (Favourite)">
  <ToggleButton iconOnly label="Favourite" tone="warning" tooltip>
    {#snippet icon()}<Star class="size-4" aria-hidden="true" />{/snippet}
    {#snippet pressedIcon()}<Star class="size-4 fill-current" aria-hidden="true" />{/snippet}
  </ToggleButton>
</Story>

<Story name="Mute, outline">
  <ToggleButton variant="outline" tone="error">
    {#snippet icon()}<VolumeX class="size-4" aria-hidden="true" />{/snippet}
    Mute
  </ToggleButton>
</Story>
