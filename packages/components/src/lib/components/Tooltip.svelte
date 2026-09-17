<script lang="ts">
  import { clsx } from 'clsx';
  import { Tooltip } from 'melt/builders';
  import type { Snippet } from 'svelte';

  type Props = {
    /** Tooltip text. Ignored when the `content` snippet is given. */
    text?: string;
    /** Element the tooltip describes. */
    children?: Snippet;
    /** Replaces the plain-text tooltip body. */
    content?: Snippet;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    openDelay?: number;
    closeDelay?: number;
    triggerClass?: string;
    contentClass?: string;
  };

  let {
    text = '',
    children,
    content,
    placement = 'top',
    openDelay = 0,
    closeDelay = 0,
    triggerClass = '',
    contentClass = ''
  }: Props = $props();

  const tooltip = new Tooltip({
    openDelay: () => openDelay,
    closeDelay: () => closeDelay,
    closeOnPointerDown: false,
    floatingConfig: () => ({ computePosition: { placement } })
  });
</script>

<span {...tooltip.trigger} class={clsx('inline-block', triggerClass)}>
  {@render children?.()}
</span>

<!--
  The content element is a `span` so that a tooltip can be used inline inside a
  paragraph without producing invalid HTML.
-->
<span
  {...tooltip.content}
  class={clsx(
    'z-50 block rounded-md bg-slate-900 px-3 py-1.5 text-sm text-slate-50 shadow-md',
    contentClass
  )}
>
  <span {...tooltip.arrow} class="absolute block size-2 rotate-45 bg-slate-900"></span>
  {#if content}
    {@render content()}
  {:else}
    {text}
  {/if}
</span>
