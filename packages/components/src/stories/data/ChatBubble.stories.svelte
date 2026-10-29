<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ChatBubble from '../../lib/data/ChatBubble.svelte';
  import MessageThread from '../../lib/data/MessageThread.svelte';

  const { Story } = defineMeta({
    title: 'Data/ChatBubble',
    component: ChatBubble,
    parameters: {
      docs: {
        description: {
          component:
            'One message of a `MessageThread`: an article named by its author and time, so a reader moves message to message. The viewer’s own messages sit at the end; the author string, not the side, says whose they are.',
        },
      },
    },
  });

  const now = Date.now();
</script>

{#snippet initials(text: string)}
  <div class="avatar avatar-placeholder">
    <div class="bg-neutral text-neutral-content w-8 rounded-full"><span class="text-xs">{text}</span></div>
  </div>
{/snippet}

<Story name="Two-party thread">
  <MessageThread label="Comments on Bed 4" class="max-w-md">
    <ChatBubble author="Ada Lovelace" sentAt={now - 26 * 60_000} relative>
      {#snippet avatar()}{@render initials('AL')}{/snippet}
      The tomatoes need staking before the wind on Thursday.
    </ChatBubble>
    <ChatBubble author="You" sentAt={now - 20 * 60_000} relative side="end" tone="primary">
      On it this afternoon.
      {#snippet footer()}Delivered{/snippet}
    </ChatBubble>
    <ChatBubble author="Ada Lovelace" sentAt={now - 2 * 60_000} relative>
      {#snippet avatar()}{@render initials('AL')}{/snippet}
      Thanks! Use the soft ties, not wire.
      {#snippet footer()}Edited{/snippet}
    </ChatBubble>
  </MessageThread>
</Story>

<Story name="Tones, absolute time">
  <MessageThread label="Tones" class="max-w-md">
    {#each ['neutral', 'secondary', 'accent', 'info', 'success', 'warning', 'error'] as const as tone (tone)}
      <ChatBubble author="Garden coordinator" sentAt="2026-10-14T09:30:00Z" locales="en-AU" {tone}>{tone}</ChatBubble>
    {/each}
  </MessageThread>
</Story>
