<script lang="ts">
  import Link from '../../../src/lib/ui/Link.svelte';
  import LinkPreview from '../../../src/lib/ui/LinkPreview.svelte';

  interface Props {
    load?: ((signal: AbortSignal) => Promise<string>) | undefined;
    open?: boolean | undefined;
    openDelay?: number | undefined;
  }

  let { load, open = $bindable(false), openDelay = 0 }: Props = $props();
</script>

<button type="button">Before</button>
<LinkPreview bind:open {openDelay} closeDelay={0} {load}>
  {#snippet trigger({ props })}
    <Link {...props} href="/taxa/rosa-canina">Rosa canina</Link>
  {/snippet}
  {#snippet children({ data })}
    <p>Dog rose. {data ?? 'A scrambling wild rose.'}</p>
  {/snippet}
</LinkPreview>
<button type="button">After</button>
