<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Bold, Italic, LayoutGrid, List, Map as MapIcon, Underline } from '@lucide/svelte';
  import ToggleGroup from '../../lib/ui/ToggleGroup.svelte';

  const { Story } = defineMeta({
    title: 'UI/ToggleGroup',
    component: ToggleGroup,
    parameters: {
      docs: {
        description: {
          component:
            'Toggle buttons answering one question. `type="single"` is a segmented control (a radiogroup: arrows move and select, Tab lands on the checked item); `type="multiple"` is a set of independent `aria-pressed` toggles. One Tab stop either way.',
        },
      },
    },
  });
</script>

<Story name="View switcher">
  <ToggleGroup
    type="single"
    label="View"
    value="grid"
    required
    items={[
      { value: 'grid', label: 'Grid', icon: grid },
      { value: 'list', label: 'List', icon: list },
      { value: 'map', label: 'Map', icon: map },
    ]}
  />
</Story>

<Story name="Icon-only with tooltips">
  <ToggleGroup
    type="single"
    label="View"
    value="list"
    tooltip
    items={[
      { value: 'grid', label: 'Grid', icon: grid, iconOnly: true },
      { value: 'list', label: 'List', icon: list, iconOnly: true },
      { value: 'map', label: 'Map', icon: map, iconOnly: true },
    ]}
  />
</Story>

<Story name="Formatting bar (multiple)">
  <ToggleGroup
    type="multiple"
    label="Formatting"
    variant="ghost"
    tone="neutral"
    items={[
      { value: 'bold', label: 'Bold', icon: bold, iconOnly: true },
      { value: 'italic', label: 'Italic', icon: italic, iconOnly: true },
      { value: 'underline', label: 'Underline', icon: underline, iconOnly: true },
    ]}
  />
</Story>

<Story name="Filter: deselectable, check marks, a disabled item">
  <ToggleGroup
    type="multiple"
    label="Show"
    showCheck
    items={[
      { value: 'annuals', label: 'Annuals' },
      { value: 'perennials', label: 'Perennials' },
      { value: 'bulbs', label: 'Bulbs', disabled: true },
    ]}
  />
</Story>

<Story name="Block and vertical">
  <div class="flex max-w-md flex-col gap-6">
    <ToggleGroup
      type="single"
      label="Period"
      value="week"
      block
      items={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ]}
    />
    <ToggleGroup
      type="single"
      label="Units"
      orientation="vertical"
      items={[
        { value: 'metric', label: 'Metric' },
        { value: 'imperial', label: 'Imperial' },
      ]}
    />
  </div>
</Story>

{#snippet grid()}<LayoutGrid class="size-4" aria-hidden="true" />{/snippet}
{#snippet list()}<List class="size-4" aria-hidden="true" />{/snippet}
{#snippet map()}<MapIcon class="size-4" aria-hidden="true" />{/snippet}
{#snippet bold()}<Bold class="size-4" aria-hidden="true" />{/snippet}
{#snippet italic()}<Italic class="size-4" aria-hidden="true" />{/snippet}
{#snippet underline()}<Underline class="size-4" aria-hidden="true" />{/snippet}
