<script lang="ts">
  import Main from '../../../src/lib/layout/Main.svelte';
  import SkipLink from '../../../src/lib/layout/SkipLink.svelte';

  interface Props {
    multiple?: boolean | undefined;
  }

  let { multiple = false }: Props = $props();
</script>

{#if multiple}
  <SkipLink
    targets={[
      { id: 'search', label: 'Skip to search' },
      { id: 'main-content', label: 'Skip to main content' },
    ]}
  />
{:else}
  <SkipLink />
{/if}
<nav aria-label="Site">
  <a href="#home">Home</a>
  <a href="#beds">Beds</a>
</nav>
<input id="search" aria-label="Search" />
<Main>
  <h1>Bed 4</h1>
  <a href="#first">First link in main</a>
</Main>
