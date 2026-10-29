<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import VStack from '../../lib/layout/VStack.svelte';

  const { Story } = defineMeta({ title: 'Layout/VStack', component: VStack });
</script>

<Story name="Gap scale">
  <div class="flex gap-8">
    {#each ['xs', 'sm', 'md', 'lg', 'xl'] as const as gap (gap)}
      <VStack {gap}>
        <span class="badge">{gap}</span><span class="badge">Sow</span><span class="badge">Water</span>
      </VStack>
    {/each}
  </div>
</Story>

<Story name="List with dividers">
  <VStack as="ul" divider gap="sm" class="max-w-xs">
    <li>North bed</li>
    <li>Glasshouse</li>
    <li>Herb spiral</li>
  </VStack>
</Story>
