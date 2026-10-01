<!-- @component
A `<figure>` with an optional `<figcaption>`, for media that needs a caption.
-->
<!--
  Figure — a `<figure>` with an optional `<figcaption>`, for media that needs
  a caption associated with it (an image, a video, a diagram).

  ARIA contract: none beyond the native grouping — `<figure>`/`<figcaption>`
  already associate the caption with its content for assistive technology.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Rendered as `<figcaption>`; a plain string or a snippet for richer markup. */
    caption?: string | Snippet<[]> | undefined;
    /** The image, video or diagram the caption describes. */
    children: Snippet<[]>;
  }

  let { caption, children, class: className, ...rest }: Props = $props();
</script>

<figure {...rest} class={className}>
  {@render children()}
  {#if caption}
    <figcaption>
      {#if typeof caption === 'string'}
        {caption}
      {:else}
        {@render caption()}
      {/if}
    </figcaption>
  {/if}
</figure>
