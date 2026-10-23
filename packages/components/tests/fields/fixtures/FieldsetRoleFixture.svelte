<!-- A role-based group inside a `Fieldset`, named by the legend through the
     `labelId` the fieldset hands its children. -->
<script lang="ts">
  import Fieldset from '../../../src/lib/fields/Fieldset.svelte';
</script>

<Fieldset legend="Watering">
  {#snippet children({ labelId })}
    <div role="radiogroup" aria-labelledby={labelId}>
      <button type="button" role="radio" aria-checked="true" tabindex="0">Weekly</button>
    </div>
  {/snippet}
</Fieldset>
