<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ExpandableText from '../../lib/ui/ExpandableText.svelte';

  const { Story } = defineMeta({
    title: 'UI/ExpandableText',
    component: ExpandableText,
    parameters: {
      docs: {
        description: {
          component:
            'Long text clamped to `lines` lines, with a "Show more" toggle that appears only when the text overflows at the current width. The full text stays in the DOM and is read in either state; clamping is visual only. Resize the frame to see the toggle come and go.',
        },
      },
    },
  });

  const description =
    'The dog rose is a variable climbing wild rose native to Europe, north-west Africa and western Asia. It is a deciduous shrub ranging in height from one to five metres, though it can sometimes scramble higher into the crowns of taller trees. Its stems are covered with small, sharp, hooked prickles, which aid it in climbing. The flowers are usually pale pink, but can vary between a deep pink and white.';
</script>

<Story name="Long">
  <div class="max-w-sm">
    <ExpandableText><p>{description}</p></ExpandableText>
  </div>
</Story>

<Story name="Short (no toggle)">
  <div class="max-w-sm">
    <ExpandableText><p>A short note fits on one line.</p></ExpandableText>
  </div>
</Story>

<Story name="Resizable frame">
  <div class="max-w-full resize-x overflow-auto border border-base-300 p-3" style="width: 20rem">
    <ExpandableText lines={2}><p>{description}</p></ExpandableText>
  </div>
</Story>

<Story name="Fade, one-way">
  <div class="max-w-sm">
    <ExpandableText fade oneWay><p>{description}</p></ExpandableText>
  </div>
</Story>

<Story name="Lines 1 to 6">
  <div class="grid max-w-sm gap-6">
    {#each [1, 2, 3, 4, 5, 6] as const as lines (lines)}
      <ExpandableText {lines}><p>{description}</p></ExpandableText>
    {/each}
  </div>
</Story>
