<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import PullToRefresh from '../../../src/lib/data/PullToRefresh.svelte';

  type Props = Omit<ComponentProps<typeof PullToRefresh>, 'children'>;

  let { refreshing = $bindable(false), ...rest }: Props = $props();
</script>

<PullToRefresh {...rest} bind:refreshing style="height: 200px" data-testid="ptr">
  <ul>
    {#each Array.from({ length: 40 }, (_, index) => index + 1) as row (row)}
      <li style="height: 24px">Row {row}</li>
    {/each}
  </ul>
</PullToRefresh>
