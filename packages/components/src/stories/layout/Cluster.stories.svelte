<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Cluster from '../../lib/layout/Cluster.svelte';

  const { Story } = defineMeta({ title: 'Layout/Cluster', component: Cluster });
  const tags = ['Annual', 'Full sun', 'Frost tender', 'Climber', 'Edible', 'Pollinator friendly', 'Heirloom'];
</script>

<Story name="Wrapping tags">
  <Cluster as="ul" class="max-w-xs">
    {#each tags as tag (tag)}<li class="badge badge-outline">{tag}</li>{/each}
  </Cluster>
</Story>
