<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SegmentBar from '../../lib/feedback/SegmentBar.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/SegmentBar',
    component: SegmentBar,
    parameters: {
      docs: {
        description: {
          component:
            'One bar split into proportional segments, as a SINGLE `role="img"` whose `aria-label` spells out every segment — so assistive technology gets the comparison in one read instead of a dozen unlabelled boxes. Fractions are given, not derived; a total under 1 leaves the track showing.',
        },
      },
    },
  });
</script>

<Story name="A breakdown">
  <div class="max-w-xl">
    <SegmentBar
      label="Storage"
      showValues
      segments={[
        { label: 'Photos', fraction: 0.62, tone: 'primary' },
        { label: 'Video', fraction: 0.31, tone: 'secondary' },
        { label: 'Other', fraction: 0.07, tone: 'neutral' },
      ]}
    />
  </div>
</Story>

<Story name="Two-sided, with a marker">
  <div class="max-w-xl">
    <SegmentBar
      label="Two-candidate preferred"
      size="lg"
      showValues
      marker={0.5}
      segments={[
        { label: 'Nguyen', fraction: 0.541, tone: 'info' },
        { label: 'Smith', fraction: 0.459, tone: 'error' },
      ]}
    />
  </div>
</Story>

<Story name="Colour tokens, and a remainder">
  <div class="max-w-xl space-y-4">
    <!-- The app's theme declares `--rank-genus` and friends in both themes;
         the component only ever names them. -->
    <SegmentBar
      label="Records by rank"
      segments={[
        { label: 'Species', fraction: 0.48, colourToken: '--rank-species' },
        { label: 'Genus', fraction: 0.22, colourToken: '--rank-genus' },
        { label: 'Family', fraction: 0.1, colourToken: '--rank-family' },
      ]}
    />
    <SegmentBar
      label="Beds surveyed"
      size="sm"
      segments={[{ label: 'Surveyed', fraction: 0.38, tone: 'success' }]}
    />
  </div>
</Story>
