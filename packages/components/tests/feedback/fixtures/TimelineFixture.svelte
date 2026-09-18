<!-- The `item` snippet needs real markup, which `createRawSnippet` cannot
     express — hence a fixture. `isCurrent`/`href` are left to the default
     context; only `href` is read, and the default is the identity. -->
<script lang="ts">
  import Timeline from '../../../src/lib/feedback/Timeline.svelte';
  import type { TimelineEntry } from '../../../src/lib/feedback/Timeline.svelte';

  interface Props {
    items: readonly TimelineEntry[];
  }

  let { items }: Props = $props();
</script>

<Timeline {items} label="Beds">
  {#snippet item(entry)}
    <p data-testid={`custom-${entry.id}`}>{entry.label.toUpperCase()}</p>
  {/snippet}
</Timeline>
