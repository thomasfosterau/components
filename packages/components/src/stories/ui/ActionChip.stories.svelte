<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CalendarPlus, MapPin, Share2 } from '@lucide/svelte';
  import ActionChip from '../../lib/ui/ActionChip.svelte';
  import ChipGroup from '../../lib/ui/ChipGroup.svelte';

  const { Story } = defineMeta({
    title: 'UI/ActionChip',
    component: ActionChip,
    parameters: {
      docs: {
        description: {
          component:
            'Compact pill controls: assist chips (contextual actions), filter chips (toggles with a check) and suggestion chips (quick replies). Not `Chip`, the colour swatch for legends; not `Badge`, which does nothing; not `TagsInput`, whose tokens are removable input.',
        },
      },
    },
  });

  const plants = [
    { name: 'Basil', type: 'annual' },
    { name: 'Rosemary', type: 'perennial' },
    { name: 'Tomato', type: 'annual' },
    { name: 'Thyme', type: 'perennial' },
  ];
</script>

<script lang="ts">
  let annuals = $state(true);
  let perennials = $state(false);
  const wanted = $derived([...(annuals ? ['annual'] : []), ...(perennials ? ['perennial'] : [])]);
  const shown = $derived(
    plants.filter((plant) => wanted.length === 0 || wanted.includes(plant.type)),
  );
</script>

<Story name="Assist row">
  {#snippet template()}
    <ChipGroup label="Actions for Bed 4">
      <ActionChip href="/beds/4/directions">
        {#snippet icon()}<MapPin class="size-4" aria-hidden="true" />{/snippet}
        Directions
      </ActionChip>
      <ActionChip onclick={() => undefined}>
        {#snippet icon()}<CalendarPlus class="size-4" aria-hidden="true" />{/snippet}
        Add to calendar
      </ActionChip>
      <ActionChip onclick={() => undefined} elevated>
        {#snippet icon()}<Share2 class="size-4" aria-hidden="true" />{/snippet}
        Share
      </ActionChip>
    </ChipGroup>
  {/snippet}
</Story>

<Story name="Filter group over a list">
  {#snippet template()}
    <div class="flex flex-col gap-4">
      <ChipGroup label="Plant type">
        <ActionChip kind="filter" bind:selected={annuals}>Annuals</ActionChip>
        <ActionChip kind="filter" bind:selected={perennials}>Perennials</ActionChip>
      </ChipGroup>
      <ul class="list-disc ps-6">
        {#each shown as plant (plant.name)}<li>{plant.name}</li>{/each}
      </ul>
    </div>
  {/snippet}
</Story>

<Story name="Suggestion replies">
  {#snippet template()}
    <div role="status" aria-live="polite">
      <ChipGroup label="Suggested replies">
        <ActionChip kind="suggestion" onclick={() => undefined}>Water tomorrow</ActionChip>
        <ActionChip kind="suggestion" onclick={() => undefined}>Did you mean Solanum?</ActionChip>
        <ActionChip kind="suggestion" onclick={() => undefined}>Thanks!</ActionChip>
      </ChipGroup>
    </div>
  {/snippet}
</Story>
