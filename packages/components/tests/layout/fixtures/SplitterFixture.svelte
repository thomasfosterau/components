<!-- A Splitter with text panes, a fixed-size container so drags map to known
     percentages, and the bound `size` echoed for assertions. -->
<script lang="ts">
  import Splitter from '../../../src/lib/layout/Splitter.svelte';

  interface Props {
    size?: number | undefined;
    minSize?: number | undefined;
    maxSize?: number | undefined;
    step?: number | undefined;
    collapsible?: boolean | undefined;
    orientation?: 'horizontal' | 'vertical' | undefined;
    handleLabel?: string | undefined;
    dir?: 'ltr' | 'rtl' | undefined;
    onCommit?: ((size: number) => void) | undefined;
  }

  let {
    size = 50,
    minSize,
    maxSize,
    step,
    collapsible,
    orientation,
    handleLabel,
    dir = 'ltr',
    onCommit,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let bound = $state(size);
</script>

<p data-testid="size">{bound}</p>
<div {dir} style="width: 400px; height: 400px;">
  <Splitter
    bind:size={bound}
    {minSize}
    {maxSize}
    {step}
    {collapsible}
    {orientation}
    {handleLabel}
    {onCommit}
    style="height: 100%;"
    data-testid="splitter"
  >
    {#snippet start()}<p>Bed list</p>{/snippet}
    {#snippet end()}<p>Bed 4 properties</p>{/snippet}
  </Splitter>
</div>
