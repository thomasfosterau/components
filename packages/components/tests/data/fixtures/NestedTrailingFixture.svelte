<!-- A link row whose trailing holds a button: the markup bug ListRow warns about. -->
<script lang="ts">
  import ListRow from '../../../src/lib/data/ListRow.svelte';
</script>

<ListRow headline="Units" href="/settings/units">
  {#snippet trailing()}<button type="button">Change</button>{/snippet}
</ListRow>
