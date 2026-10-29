<!-- A two-party thread with avatars, a footer and one relative time. -->
<script lang="ts">
  import ChatBubble from '../../../src/lib/data/ChatBubble.svelte';
  import MessageThread from '../../../src/lib/data/MessageThread.svelte';

  interface Props {
    live?: boolean | undefined;
  }

  let { live }: Props = $props();
  const sent = '2026-10-14T09:30:00Z';
  const now = Date.now();
</script>

<MessageThread label="Comments on Bed 4" {live}>
  <ChatBubble author="Ada Lovelace" sentAt={sent} locales="en-AU" data-testid="ada">
    {#snippet avatar()}<img src="data:," alt="" class="w-8 rounded-full" />{/snippet}
    The tomatoes need staking.
  </ChatBubble>
  <ChatBubble author="You" sentAt={now - 3 * 60_000} relative side="end" tone="primary" class="mt-2" data-testid="you">
    On it this afternoon.
    {#snippet footer()}Delivered{/snippet}
  </ChatBubble>
</MessageThread>
