<!-- Story helper: a mail-style list whose full swipe deletes with an Undo toast.
     `getToaster()` must run in a descendant of `Toaster`. Not a library component. -->
<script lang="ts">
  import { Archive, Pin, Trash2 } from '@lucide/svelte';
  import SwipeActions from '../../lib/data/SwipeActions.svelte';
  import SwipeGroup from '../../lib/data/SwipeGroup.svelte';
  import { getToaster } from '../../lib/feedback/toaster.ts';

  interface Props {
    /** Show the "More actions" button on touch too. */
    menuButton?: boolean | 'auto' | undefined;
  }

  let { menuButton = 'auto' }: Props = $props();

  const toaster = getToaster();
  let messages = $state([
    { id: 1, from: 'Seed library', subject: 'Your heirloom tomatoes have shipped' },
    { id: 2, from: 'Community garden', subject: 'Working bee this Saturday' },
    { id: 3, from: 'Weather service', subject: 'Frost warning for Tuesday night' },
    { id: 4, from: 'Ada', subject: 'Can I borrow the broadfork?' },
  ]);

  function remove(id: number): void {
    const index = messages.findIndex((message) => message.id === id);
    const [removed] = messages.splice(index, 1);
    if (removed === undefined) return;
    toaster.add({
      title: 'Message deleted',
      action: { label: 'Undo', onAction: () => void messages.splice(index, 0, removed) },
    });
  }
</script>

{#snippet pinIcon()}<Pin class="size-5" />{/snippet}
{#snippet archiveIcon()}<Archive class="size-5" />{/snippet}
{#snippet trashIcon()}<Trash2 class="size-5" />{/snippet}

<SwipeGroup>
  <ul class="divide-base-300 border-base-300 max-w-md divide-y border-y">
    {#each messages as message (message.id)}
      <li>
        <SwipeActions
          rowLabel={message.subject}
          fullSwipe
          {menuButton}
          leading={[{ label: 'Pin', icon: pinIcon, tone: 'info', onAction: () => undefined }]}
          trailing={[
            { label: 'Delete', icon: trashIcon, destructive: true, onAction: () => remove(message.id) },
            { label: 'Archive', icon: archiveIcon, tone: 'neutral', onAction: () => remove(message.id) },
          ]}
        >
          <div class="px-4 py-3">
            <p class="font-medium">{message.from}</p>
            <p class="text-base-content/70 text-sm">{message.subject}</p>
          </div>
        </SwipeActions>
      </li>
    {/each}
  </ul>
</SwipeGroup>
