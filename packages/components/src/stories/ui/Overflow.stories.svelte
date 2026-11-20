<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Breadcrumbs from '../../lib/layout/Breadcrumbs.svelte';
  import Tabs from '../../lib/layout/Tabs.svelte';
  import Overflow from '../../lib/ui/Overflow.svelte';

  const { Story } = defineMeta({
    title: 'UI/Overflow',
    component: Overflow,
    parameters: {
      docs: {
        description: {
          component:
            'Shows as many items as fit and moves the rest, lowest priority first, into a "More" menu. Shown at three widths; `Tabs mode="links"` and `Breadcrumbs` take it through an `overflow` prop.',
        },
      },
    },
  });

  const actions = [
    { id: 'water', label: 'Water', priority: 2 },
    { id: 'feed', label: 'Feed' },
    { id: 'prune', label: 'Prune' },
    { id: 'harvest', label: 'Harvest', priority: 1 },
    { id: 'mulch', label: 'Mulch' },
    { id: 'photo', label: 'Add photo' },
    { id: 'note', label: 'Add note' },
    { id: 'archive', label: 'Archive' },
  ];

  const sections = ['Overview', 'Plantings', 'Harvests', 'Soil tests', 'Watering', 'Pests', 'Photos', 'Notes'].map(
    (label) => ({ value: label.toLowerCase(), label, href: `#${label.toLowerCase()}` }),
  );

  const trail = [
    { label: 'Home', href: '#' },
    { label: 'Gardens', href: '#' },
    { label: 'Community garden, Rosebery', href: '#' },
    { label: 'North beds', href: '#' },
    { label: 'Bed 4' },
  ];

  const widths = [240, 420, 720] as const;
</script>

<Story name="Action row">
  {#snippet template()}
    <div class="flex flex-col gap-6">
      {#each widths as width (width)}
        <div class="border-base-300 rounded-box border p-2" style="width: {width}px;">
          <Overflow items={actions} aria-label="Bed actions" class="gap-1">
            {#snippet item(action, _index, attributes)}
              <button {...attributes} type="button" class="btn btn-sm">{action.label}</button>
            {/snippet}
          </Overflow>
        </div>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Link tabs">
  {#snippet template()}
    <div class="flex flex-col gap-6">
      {#each widths as width (width)}
        <div style="width: {width}px;">
          <Tabs mode="links" items={sections} value="photos" label="Bed sections" overflow />
        </div>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="Breadcrumbs">
  {#snippet template()}
    <div class="flex flex-col gap-6">
      {#each widths as width (width)}
        <div style="width: {width}px;">
          <Breadcrumbs items={trail} overflow />
        </div>
      {/each}
    </div>
  {/snippet}
</Story>
