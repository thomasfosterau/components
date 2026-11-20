<!-- A Truncate in a box of a given width, optionally inside a link. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Truncate from '../../../src/lib/ui/Truncate.svelte';

  type Props = ComponentProps<typeof Truncate> & { width: number; link?: boolean | undefined };

  let { width, link = false, ...props }: Props = $props();
</script>

<div style:width="{width}px" style:font="16px monospace">
  {#if link}
    <a href="#file" style:display="block"><Truncate {...props} /></a>
  {:else}
    <Truncate {...props} />
  {/if}
</div>
