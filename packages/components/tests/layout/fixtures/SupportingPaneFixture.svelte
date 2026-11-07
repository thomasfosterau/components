<script lang="ts">
  import SupportingPane from '../../../src/lib/layout/SupportingPane.svelte';
</script>

<SupportingPane title="Properties" toggleLabel="Properties" open={false}>
  <p>The canvas.</p>
  {#snippet supporting()}<p>Bed 4 is 2 × 1.2 m.</p>{/snippet}
</SupportingPane>
