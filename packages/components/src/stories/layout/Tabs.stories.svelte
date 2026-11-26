<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Tabs from '../../lib/layout/Tabs.svelte';
  import type { TabItem } from '../../lib/layout/types.ts';

  const { Story } = defineMeta({
    title: 'Layout/Tabs',
    component: Tabs,
    parameters: {
      docs: {
        description: {
          component:
            'One strip, two things. `panels` is a tab widget on bits-ui — roving tabindex, Arrow/Home/End, `aria-selected`, `aria-controls`. `links` is navigation between sibling routes that happens to look like tabs: ordinary anchors in a labelled `<nav>` with `aria-current="page"`, because a `role="tab"` that navigates lies about what pressing it does.',
        },
      },
    },
  });

  const items: readonly TabItem[] = [
    { value: 'fp', label: 'First preferences', href: '/fp' },
    { value: 'tcp', label: 'Two-candidate preferred', href: '/tcp' },
    { value: 'booths', label: 'Polling places', href: '/booths' },
    { value: 'recount', label: 'Recount', href: '/recount', disabled: true },
  ];
</script>

<script lang="ts">
  const manyItems: readonly TabItem[] = Array.from({ length: 12 }, (_, i) => ({
    value: `section-${i + 1}`,
    label: `Section number ${i + 1}`,
  }));

  let selected = $state('tcp');
</script>

<Story name="Panels" asChild>
  <Tabs {items} label="Results views">
    {#snippet panel(item)}
      <p class="leading-7">The {item.label.toLowerCase()} for every booth in the division.</p>
    {/snippet}
  </Tabs>
</Story>

<Story name="Panels, bound" asChild>
  <div class="space-y-3">
    <Tabs {items} bind:value={selected} label="Results views">
      {#snippet panel(item)}<p class="leading-7">{item.label}</p>{/snippet}
    </Tabs>
    <p class="text-base-content/70 text-sm">Bound value: <code>{selected}</code></p>
  </div>
</Story>

<Story name="Panels, scroll buttons" asChild>
  <div class="max-w-sm">
    <Tabs items={manyItems} label="Sections" scrollButtons>
      {#snippet panel(item)}<p class="leading-7">{item.label}</p>{/snippet}
    </Tabs>
  </div>
</Story>

<Story name="Variants and sizes" asChild>
  <div class="space-y-6">
    <Tabs {items} variant="box" size="sm" label="Boxed" />
    <Tabs {items} variant="lift" label="Lifted" />
    <Tabs {items} variant="border" size="lg" label="Bordered" />
  </div>
</Story>

<Story name="Links" asChild>
  <Tabs {items} mode="links" value="tcp" label="Results views" />
</Story>
