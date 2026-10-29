<!-- @component
One message of a `MessageThread`: author, time, avatar, the body and a status line, as a daisyUI `chat` bubble.
-->
<!--
  ChatBubble — an `<li>` holding an `<article>` named by its header, so a
  reader moves message to message and hears "Ada Lovelace, 3 minutes ago"
  before the body. The time is a real `<time datetime>` (`DateTime`, or
  `RelativeTime` with the absolute instant in `title`). The avatar is
  decorative (`aria-hidden`): the author's name is already text.

  `side` is visual only: messages from the viewer sit at the end, and the
  author string ("You") is what says whose they are, never the position or
  the colour. The `<article>` is the daisyUI `chat` grid itself, so its
  image / header / bubble / footer are its direct children, as
  `chat.css` requires.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import DateTime from '../formatting/DateTime.svelte';
  import RelativeTime from '../formatting/RelativeTime.svelte';
  import { chatBubbleTone, type Tone } from '../ui/tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** Display name of the author; part of the message's accessible name. */
    author: string;
    /** When it was sent: a `Date`, epoch milliseconds or an ISO string. */
    sentAt?: Date | number | string | undefined;
    /**
     * `'end'` for the viewer's own messages.
     * @defaultValue `'start'`
     */
    side?: 'start' | 'end' | undefined;
    /** Bubble colour. Omitted, daisyUI's neutral bubble. */
    tone?: Tone | undefined;
    /**
     * Show `sentAt` relative ("3 minutes ago") rather than absolute.
     * @defaultValue `false`
     */
    relative?: boolean | undefined;
    /** Locale(s) for the time; falls back to the components context. */
    locales?: string | readonly string[] | undefined;
    /** The avatar (an `Avatar` or an image); decorative here. */
    avatar?: Snippet<[]> | undefined;
    /** Status line under the bubble ("Delivered", "Edited"). */
    footer?: Snippet<[]> | undefined;
    /** The message body. */
    children: Snippet<[]>;
  }

  let {
    author,
    sentAt,
    side = 'start',
    tone,
    relative = false,
    locales,
    avatar,
    footer,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const headerId = `${uid}-header`;
  const sideClass = { start: 'chat-start', end: 'chat-end' } as const;
</script>

<li>
  <article {...rest} aria-labelledby={headerId} class={['chat', sideClass[side], className]}>
    {#if avatar}
      <div class="chat-image avatar" aria-hidden="true">{@render avatar()}</div>
    {/if}
    <div class="chat-header" id={headerId}>
      {author}{#if sentAt !== undefined}<span class="sr-only">,</span>
        {#if relative}
          <RelativeTime value={sentAt} {locales} class="text-xs opacity-60" />
        {:else}
          <DateTime value={sentAt} {locales} dateStyle="medium" timeStyle="short" class="text-xs opacity-60" />
        {/if}
      {/if}
    </div>
    <div class={['chat-bubble', tone !== undefined && chatBubbleTone[tone]]}>{@render children()}</div>
    {#if footer}
      <div class="chat-footer opacity-60">{@render footer()}</div>
    {/if}
  </article>
</li>
