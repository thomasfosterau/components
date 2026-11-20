<!-- A settings screen: a group of a switch row, a link row with a value, a
     destructive button row and a plain text row; `current` is the page the
     context says is shown. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import ListGroup from '../../../src/lib/data/ListGroup.svelte';
  import ListRow from '../../../src/lib/data/ListRow.svelte';

  interface Props {
    current?: string | undefined;
    onDelete?: (() => void) | undefined;
    disabled?: boolean | undefined;
  }

  let { current, onDelete, disabled }: Props = $props();

  setComponentsContext({ isCurrent: (href) => href === current });

  let digests = $state(false);
</script>

<ListGroup title="Notifications" description="How we reach you." footer="Changes save at once.">
  <ListRow headline="Email digests" supporting="A summary every Monday.">
    {#snippet trailing({ labelledBy, describedBy })}
      <input
        type="checkbox"
        role="switch"
        class="toggle"
        bind:checked={digests}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      />
    {/snippet}
  </ListRow>
  <ListRow headline="Units" supporting="How distances read." href="/settings/units">
    {#snippet trailing()}<span>Metric</span>{/snippet}
  </ListRow>
  <ListRow headline="Delete account" tone="error" onclick={() => onDelete?.()} {disabled} />
</ListGroup>
<p data-testid="digests">{digests ? 'on' : 'off'}</p>
