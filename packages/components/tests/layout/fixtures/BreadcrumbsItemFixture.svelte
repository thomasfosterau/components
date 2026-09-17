<!-- `Breadcrumbs` with a per-crumb `item` snippet — the case a `.ts` test
     cannot express, because the snippet takes parameters and renders markup. -->
<script lang="ts">
  import Breadcrumbs from '../../../src/lib/layout/Breadcrumbs.svelte';
  import type { Crumb } from '../../../src/lib/layout/types.ts';

  interface Props {
    items: readonly Crumb[];
  }

  let { items }: Props = $props();
</script>

<Breadcrumbs {items}>
  {#snippet item(crumb, index)}
    {#if index < items.length - 1 && crumb.href !== undefined}
      <a href={crumb.href} class="link">{crumb.label}</a>
    {:else}
      <em data-testid="custom-current">{crumb.label}</em>
    {/if}
  {/snippet}
</Breadcrumbs>
