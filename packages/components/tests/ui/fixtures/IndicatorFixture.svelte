<script lang="ts">
  import Badge from '../../../src/lib/ui/Badge.svelte';
  import Indicator from '../../../src/lib/ui/Indicator.svelte';
  import type { IndicatorPlacement } from '../../../src/lib/ui/tones.ts';

  interface Props {
    placement?: IndicatorPlacement | undefined;
  }

  let { placement }: Props = $props();
</script>

{#snippet count()}<Badge tone="error">3</Badge>{/snippet}

<Indicator item={count} {placement} data-testid="indicator" class="mine">
  <button type="button" aria-label="Notifications, 3 unread">Bell</button>
</Indicator>
