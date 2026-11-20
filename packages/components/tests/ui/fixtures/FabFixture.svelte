<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import type { ComponentProps } from 'svelte';
  import FloatingActionButton from '../../../src/lib/ui/FloatingActionButton.svelte';

  type Props = Omit<ComponentProps<typeof FloatingActionButton>, 'icon' | 'label'>;

  let props: Props = $props();
</script>

{#snippet icon()}<Plus />{/snippet}

<FloatingActionButton {...props} label="New planting" {icon} />
