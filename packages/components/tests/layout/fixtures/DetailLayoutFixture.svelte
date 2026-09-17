<!-- `DetailLayout` with its three snippets, inside `Main` — which is where a
     page puts it, because the layout opens no landmark of its own. The
     optional `aside` is passed as a prop rather than declared inside an
     `{#if}`, which would make it a local instead of a component prop. -->
<script lang="ts">
  import DetailLayout from '../../../src/lib/layout/DetailLayout.svelte';
  import Main from '../../../src/lib/layout/Main.svelte';
  import PageHeader from '../../../src/lib/layout/PageHeader.svelte';

  interface Props {
    withAside?: boolean;
    asideLabel?: string;
  }

  let { withAside = true, asideLabel = 'Summary' }: Props = $props();
</script>

{#snippet aside()}<p data-testid="slot-aside">Family: Rosaceae</p>{/snippet}

<Main>
  <DetailLayout {asideLabel} aside={withAside ? aside : undefined}>
    {#snippet header()}
      <PageHeader title="Rosa canina" subtitle="Dog rose" data-testid="detail-header" />
    {/snippet}
    {#snippet body()}<p data-testid="slot-body">A climbing wild rose.</p>{/snippet}
  </DetailLayout>
</Main>
