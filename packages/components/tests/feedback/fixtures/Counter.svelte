<script lang="ts">
  let count = $state(0);
</script>

<p data-testid="count">{count}</p>
<button type="button" onclick={() => (count += 1)}>Count up</button>
