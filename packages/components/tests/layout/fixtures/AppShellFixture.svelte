<!-- AppShell with a real Sidebar of links, under the layout Tailwind subset. -->
<script lang="ts">
  import './layout.css';
  import AppShell from '../../../src/lib/layout/AppShell.svelte';
  import Sidebar from '../../../src/lib/layout/Sidebar.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
</script>

<AppShell>
  {#snippet sidebar()}
    <Sidebar label="Primary">
      <MenuItem href="/beds">Beds</MenuItem>
      <MenuItem href="/plants">Plants</MenuItem>
    </Sidebar>
  {/snippet}
  <main><h1>Beds</h1></main>
</AppShell>
