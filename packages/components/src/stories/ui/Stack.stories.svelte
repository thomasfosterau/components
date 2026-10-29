<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Stack from '../../lib/ui/Stack.svelte';

  const { Story } = defineMeta({
    title: 'UI/Stack',
    component: Stack,
    parameters: {
      docs: {
        description: {
          component:
            'Overlapping cards on daisyUI `stack`. Only the top item is exposed: the ones behind are `inert` and `aria-hidden`, and the depth is read as "3 items".',
        },
      },
    },
  });

  const beds = ['North bed', 'Glasshouse', 'Herb spiral'];
</script>

<Story name="Cards, peeking below">
  <Stack items={beds} class="w-56">
    {#snippet item(name)}
      <div class="card card-border bg-base-100 p-4 shadow-sm">
        <a class="link link-hover font-medium" href={`#${name}`}>{name}</a>
        <p class="text-base-content/70 text-sm">Planted this spring</p>
      </div>
    {/snippet}
  </Stack>
</Story>

<Story name="Three of twelve, peeking to the end">
  <Stack items={beds} count={12} direction="end" class="w-56">
    {#snippet item(name)}
      <div class="card bg-primary text-primary-content p-4">{name}</div>
    {/snippet}
  </Stack>
</Story>
