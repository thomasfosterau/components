<!-- Test fixture: an ImageCompare with fixed-size stand-in images and a bound value, read back through the readout. -->
<script lang="ts">
  import ImageCompare from '../../../src/lib/media/ImageCompare.svelte';

  interface Props {
    dir?: 'ltr' | 'rtl' | undefined;
    valueText?: ((value: number) => string) | undefined;
  }

  let { dir, valueText }: Props = $props();
  let value = $state(50);
</script>

<ImageCompare aria-label="Bed 4, March and November" bind:value {dir} {valueText} beforeLabel="March" afterLabel="November">
  {#snippet before()}
    <div role="img" aria-label="Bed 4 in March" style="width: 400px; height: 200px; background: #686;"></div>
  {/snippet}
  {#snippet after()}
    <div role="img" aria-label="Bed 4 in November" style="width: 400px; height: 200px; background: #864;"></div>
  {/snippet}
</ImageCompare>
<output data-testid="bound">{value}</output>
