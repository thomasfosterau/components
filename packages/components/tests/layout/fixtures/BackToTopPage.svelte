<script lang="ts">
  import BackToTop from '../../../src/lib/layout/BackToTop.svelte';
  import Main from '../../../src/lib/layout/Main.svelte';

  interface Props {
    /** Render the page inside a scrolling container instead of the window. */
    contained?: boolean | undefined;
    variant?: 'inline' | 'floating' | undefined;
  }

  let { contained = false, variant = 'inline' }: Props = $props();

  let container = $state<HTMLElement | undefined>();
</script>

{#if contained}
  <div bind:this={container} data-testid="scroller" style="height: 200px; overflow: auto;">
    <section id="account" aria-label="Account">
      <a href="#first">First link in the account</a>
      <div style="height: 3000px;"></div>
      {#if container !== undefined}
        <BackToTop target="account" threshold={400} scrollContainer={container} {variant} />
      {/if}
    </section>
  </div>
{:else}
  <Main>
    <a href="#first">First link in main</a>
    <div style="height: 3000px;"></div>
    <BackToTop threshold={400} {variant} />
  </Main>
{/if}
