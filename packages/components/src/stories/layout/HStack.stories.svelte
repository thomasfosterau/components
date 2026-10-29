<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import HStack from '../../lib/layout/HStack.svelte';

  const { Story } = defineMeta({ title: 'Layout/HStack', component: HStack });
</script>

<Story name="Row, centred">
  <HStack align="center" gap="sm">
    <span class="avatar avatar-placeholder"><span class="bg-neutral text-neutral-content w-8 rounded-full">AL</span></span>
    <span>Ada Lovelace</span>
  </HStack>
</Story>

<Story name="Responsive">
  <HStack responsive gap="md">
    <div class="card bg-base-200 p-4">Plan</div>
    <div class="card bg-base-200 p-4">Sow</div>
    <div class="card bg-base-200 p-4">Harvest</div>
  </HStack>
</Story>
