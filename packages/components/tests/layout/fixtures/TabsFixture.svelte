<!-- `Tabs` in both modes. The `panel` snippet takes the item, the value is
     bound and mirrored into the DOM, and `isCurrent` is injected rather than
     left to the default (which compares against the test runner's pathname). -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Tabs from '../../../src/lib/layout/Tabs.svelte';
  import type { TabItem, TabsMode } from '../../../src/lib/layout/types.ts';

  interface Props {
    items: readonly TabItem[];
    mode?: TabsMode;
    initial?: string;
    withPanels?: boolean;
    currentHref?: string;
  }

  let {
    items,
    mode = 'panels',
    initial = '',
    withPanels = true,
    currentHref = '/tcp',
  }: Props = $props();

  setComponentsContext({ isCurrent: (href) => href === currentHref });

  // The initial selection seeds local state once; `untrack` states that.
  let value = $state(untrack(() => initial));
</script>

<p data-testid="value">{value}</p>

{#if withPanels}
  <Tabs {items} {mode} bind:value label="Results views">
    {#snippet panel(item)}
      <p data-testid={`panel-${item.value}`}>Panel for {item.label}</p>
    {/snippet}
  </Tabs>
{:else}
  <Tabs {items} {mode} bind:value label="Results views" />
{/if}
