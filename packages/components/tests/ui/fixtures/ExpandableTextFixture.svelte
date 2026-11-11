<script lang="ts">
  import ExpandableText from '../../../src/lib/ui/ExpandableText.svelte';
  import type { ClampLines } from '../../../src/lib/ui/tones.ts';

  interface Props {
    long?: boolean | undefined;
    width?: number | undefined;
    oneWay?: boolean | undefined;
    lines?: ClampLines | undefined;
    fade?: boolean | undefined;
  }

  let { long = true, width = 320, oneWay, lines, fade }: Props = $props();
  let expanded = $state(false);

  const sentence = 'Tomatoes want full sun, deep watering and a stake by midsummer. ';
  const body = $derived(long ? `${sentence.repeat(8)}The last sentence is here.` : 'Short.');
</script>

<div data-testid="frame" style:width="{width}px" style="font: 16px/24px sans-serif">
  <ExpandableText bind:expanded {oneWay} {lines} {fade}>
    <p>{body}</p>
  </ExpandableText>
</div>
<output data-testid="expanded">{expanded}</output>

<style>
  /* The suite loads no Tailwind: the clamp rules the classes would supply. */
  :global(.line-clamp-1),
  :global(.line-clamp-2),
  :global(.line-clamp-3) {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
  }
  :global(.line-clamp-1) {
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
  :global(.line-clamp-2) {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  :global(.line-clamp-3) {
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }
  :global(.overflow-hidden) {
    overflow: hidden;
  }
</style>
