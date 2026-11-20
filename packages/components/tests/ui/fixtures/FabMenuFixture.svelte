<script lang="ts">
  import FabMenu from '../../../src/lib/ui/FabMenu.svelte';

  interface Props {
    onSelect: (label: string) => void;
  }

  let { onSelect }: Props = $props();
</script>

<button type="button">Before</button>
<FabMenu
  position="inline"
  label="Add"
  items={[
    { label: 'Planting', onSelect: () => onSelect('Planting') },
    { label: 'Harvest', onSelect: () => onSelect('Harvest') },
    { label: 'Bed', href: '/beds/new' },
  ]}
/>
<button type="button">After</button>
