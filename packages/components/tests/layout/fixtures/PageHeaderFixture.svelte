<!-- `PageHeader` with every optional region filled, inside `Main` so the
     component's `<header>` is not a `banner` (a `<header>` is only the banner
     landmark when it is NOT inside main/article/aside/nav/section). -->
<script lang="ts">
  import Main from '../../../src/lib/layout/Main.svelte';
  import PageHeader from '../../../src/lib/layout/PageHeader.svelte';

  interface Props {
    full?: boolean;
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    actionsLabel?: string;
  }

  let { full = false, headingLevel = 1, actionsLabel = 'Page actions' }: Props = $props();
</script>

<Main>
  {#if full}
    <PageHeader
      title="Tomato ‘Black Krim’"
      subtitle="Solanum lycopersicum"
      {headingLevel}
      {actionsLabel}
      data-testid="page-header"
    >
      {#snippet eyebrow()}<span data-testid="ph-eyebrow">Back bed</span>{/snippet}
      {#snippet icon()}<span data-testid="ph-icon">🍅</span>{/snippet}
      {#snippet meta()}<span data-testid="ph-meta">Sown 14 September</span>{/snippet}
      {#snippet actions()}
        <button type="button">Log a watering</button>
        <button type="button">Edit</button>
      {/snippet}
      <p data-testid="ph-children">A tab strip would go here.</p>
    </PageHeader>
  {:else}
    <PageHeader title="Tomato ‘Black Krim’" {headingLevel} data-testid="page-header" />
  {/if}
</Main>
