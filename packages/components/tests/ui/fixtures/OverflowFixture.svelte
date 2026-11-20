<!-- Test fixture: an Overflow row of fixed-width items in a container whose width the test sets. -->
<script lang="ts">
  import Overflow, { type OverflowEntry } from '../../../src/lib/ui/Overflow.svelte';
  import type { CollapseFrom } from '../../../src/lib/ui/overflow.ts';

  interface Props {
    width?: number | undefined;
    items?: readonly OverflowEntry[] | undefined;
    collapseFrom?: CollapseFrom | undefined;
  }

  const defaults: readonly OverflowEntry[] = Array.from({ length: 8 }, (_, i) => ({
    id: `item-${i + 1}`,
    label: `Item ${i + 1}`,
    href: `/items/${i + 1}`,
  }));

  let { width = 300, items = defaults, collapseFrom }: Props = $props();
</script>

<div data-testid="frame" style="width: {width}px;">
  <Overflow {items} {collapseFrom} aria-label="Sections" element="ul" style="list-style: none; margin: 0; padding: 0;">
    {#snippet item(entry)}
      <a href={entry.href} style="display: inline-block; width: 80px;">{entry.label}</a>
    {/snippet}
  </Overflow>
</div>
