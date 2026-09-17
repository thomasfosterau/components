<script module lang="ts">
  import { Info } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import Tooltip from '../../lib/ui/Tooltip.svelte';
  import VisuallyHidden from '../../lib/ui/VisuallyHidden.svelte';

  const sides = ['top', 'right', 'bottom', 'left'] as const;

  const { Story } = defineMeta({
    title: 'UI/Tooltip',
    component: Tooltip,
    parameters: {
      docs: {
        description: {
          component:
            'Supplementary text on hover and on keyboard focus, on bits-ui. It mounts its own `Tooltip.Provider`, so no app-wide setup is needed. The wiring is `aria-describedby` — a tooltip supplements a name and must never be the only source of one, because it is unreachable to touch users entirely.',
        },
      },
    },
  });
</script>

<Story name="On a button">
  <div class="p-10">
    <Tooltip text="Published gardens are visible to everyone.">
      {#snippet children({ props })}
        <Button {...props} variant="outline">Publish</Button>
      {/snippet}
    </Tooltip>
  </div>
</Story>

<!--
  The icon button still carries its OWN accessible name; the tooltip only
  describes it.
-->
<Story name="On an icon button">
  <div class="p-10">
    <Tooltip text="Watering is logged automatically." side="right">
      {#snippet children({ props })}
        <Button {...props} variant="ghost" size="sm" class="btn-circle">
          <Info class="size-4" aria-hidden="true" />
          <VisuallyHidden>About watering</VisuallyHidden>
        </Button>
      {/snippet}
    </Tooltip>
  </div>
</Story>

<Story name="Sides">
  <div class="flex flex-wrap gap-6 p-16">
    {#each sides as side (side)}
      <Tooltip text={`Anchored ${side}`} {side}>
        {#snippet children({ props })}
          <Button {...props} variant="soft">{side}</Button>
        {/snippet}
      </Tooltip>
    {/each}
  </div>
</Story>
