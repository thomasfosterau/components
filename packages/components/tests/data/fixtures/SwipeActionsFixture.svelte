<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import SwipeActions from '../../../src/lib/data/SwipeActions.svelte';
  import SwipeGroup from '../../../src/lib/data/SwipeGroup.svelte';

  type RowProps = Omit<ComponentProps<typeof SwipeActions>, 'children'>;

  interface Props {
    rows: readonly (RowProps & { name: string })[];
  }

  let { rows }: Props = $props();
</script>

<div style="width: 400px">
  <SwipeGroup>
    <ul>
      {#each rows as { name, ...row } (name)}
        <li>
          <SwipeActions {...row} rowLabel={name} data-testid={name}>
            <p style="height: 48px; margin: 0">{name}</p>
          </SwipeActions>
        </li>
      {/each}
    </ul>
  </SwipeGroup>
</div>
