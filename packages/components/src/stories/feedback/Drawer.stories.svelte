<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Drawer from '../../lib/feedback/Drawer.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/Drawer',
    component: Drawer,
    parameters: {
      docs: {
        description: {
          component:
            'A modal panel at an edge: `Dialog`’s contract (focus trap and return, Escape, scroll lock, the title as its name), sharing its implementation. `start` / `end` follow the writing direction.',
        },
      },
    },
  });
</script>

<Story name="Filters sheet (end)">
  <Drawer title="Filters" description="Narrow the plant list.">
    {#snippet trigger({ props })}<Button {...props}>Filters</Button>{/snippet}
    <div class="space-y-4">
      {#each ['Colour', 'Height', 'Season', 'Sun'] as field (field)}
        <label class="floating-label block"><span>{field}</span><input class="input w-full" placeholder={field} /></label>
      {/each}
    </div>
    {#snippet actions({ close })}
      <Button variant="ghost" onclick={close}>Cancel</Button>
      <Button tone="primary" onclick={close}>Apply</Button>
    {/snippet}
  </Drawer>
</Story>

<Story name="Action sheet (bottom)">
  <Drawer title="Bed 4" side="bottom" size="sm">
    {#snippet trigger({ props })}<Button {...props}>Actions</Button>{/snippet}
    <div class="flex flex-col gap-2">
      <Button>Rename</Button>
      <Button>Duplicate</Button>
      <Button tone="error" variant="outline">Delete</Button>
    </div>
  </Drawer>
</Story>
