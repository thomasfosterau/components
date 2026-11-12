<!-- A burst of two messages from one author; the second is grouped. -->
<script lang="ts">
  import ChatBubble from '../../../src/lib/data/ChatBubble.svelte';
  import MessageThread from '../../../src/lib/data/MessageThread.svelte';

  const now = Date.now();
</script>

<MessageThread label="A burst">
  <ChatBubble author="Ada Lovelace" sentAt={now - 3 * 60_000} relative data-testid="burst-1">
    {#snippet avatar()}<img src="data:," alt="" class="w-8 rounded-full" />{/snippet}
    And mulch the path.
  </ChatBubble>
  <ChatBubble author="Ada Lovelace" sentAt={now - 3 * 60_000} relative grouped data-testid="burst-2">
    {#snippet avatar()}<img src="data:," alt="" class="w-8 rounded-full" />{/snippet}
    Straw, not bark.
  </ChatBubble>
</MessageThread>
