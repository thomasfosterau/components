<!-- @component
A conversation: a named region holding an ordered list of `ChatBubble`s.
-->
<!--
  MessageThread — comments on a planting, a support thread, a note from the
  garden coordinator. A `<section aria-label>` (a `region` a reader can jump
  to) around an `<ol>`, because order is the content. Its children are
  `ChatBubble`s, each an `<li>`.

  `live` is for a thread that grows while it is read (live chat): the
  section becomes `role="log"`, which announces appended messages politely.
  Off by default, because a static comment history must not read itself
  out as it renders.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** Accessible name, e.g. `'Comments on Bed 4'`. */
    label: string;
    /**
     * Announce new messages as they arrive (`role="log"`).
     * @defaultValue `false`
     */
    live?: boolean | undefined;
    /** The `ChatBubble`s, oldest first. */
    children: Snippet<[]>;
  }

  let { label, live = false, children, class: className, ...rest }: Props = $props();
</script>

<section
  {...rest}
  aria-label={label}
  role={live ? 'log' : undefined}
  aria-live={live ? 'polite' : undefined}
  class={className}
>
  <ol class="flex list-none flex-col gap-1 p-0">
    {@render children()}
  </ol>
</section>
