<script lang="ts">
  import Slider from '../../../src/lib/fields/Slider.svelte';

  interface Props {
    range?: boolean | undefined;
  }

  let { range = false }: Props = $props();
</script>

<!-- What `FormField` will hand over once FieldControl carries `labelId` (#179). -->
<span id="sun-label">Hours of sun</span>
{#if range}
  <Slider labelId="sun-label" type="multiple" min={0} max={12} value={[2, 6]} />
{:else}
  <Slider labelId="sun-label" min={0} max={12} value={4} />
{/if}
