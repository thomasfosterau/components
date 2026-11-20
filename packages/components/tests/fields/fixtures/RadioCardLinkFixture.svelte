<script lang="ts">
  import RadioGroup from '../../../src/lib/fields/RadioGroup.svelte';
</script>

<RadioGroup legend="Plan" variant="cards" options={['Free', 'Pro']}>
  {#snippet card(option)}
    <a href="#{option.value}">{option.label} details</a>
  {/snippet}
</RadioGroup>
