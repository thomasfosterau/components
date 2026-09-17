<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import InfoboxRow from '../../lib/infobox/InfoboxRow.svelte';

  const { Story } = defineMeta({
    title: 'Infobox/InfoboxRow',
    component: InfoboxRow,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component:
            'One label/value pair inside an `InfoboxSection`. Empty by default — set `showEmpty` for gardeneria’s older "say so" behaviour, an em dash captioned by `emptyLabel`.',
        },
      },
    },
  });
</script>

<Story name="Plain value">
  <dl class="border-base-300 bg-base-200 w-80 border">
    <InfoboxRow label="Family" value="Solanaceae" />
  </dl>
</Story>

<Story name="Numeric value">
  <dl class="border-base-300 bg-base-200 w-80 border">
    <InfoboxRow label="Margin" value={0} />
  </dl>
</Story>

<Story name="Rich value">
  <dl class="border-base-300 bg-base-200 w-80 border">
    <InfoboxRow label="Status">
      <span class="badge badge-success badge-sm">Accepted</span>
    </InfoboxRow>
  </dl>
</Story>

<Story name="Linked value">
  <dl class="border-base-300 bg-base-200 w-80 border">
    <InfoboxRow label="Parent" value="Solanaceae" href="/taxa/solanaceae" />
  </dl>
</Story>

<Story name="Empty, rendered as nothing">
  <div class="w-80">
    <p class="text-base-content/60 mb-2 text-xs">
      Nothing below this line — an absent row renders no DOM at all.
    </p>
    <dl class="border-base-300 bg-base-200 border">
      <InfoboxRow label="Frost tolerance" />
    </dl>
  </div>
</Story>

<!-- The em dash is the point: an absent row and an unrecorded fact are
     different things, and `showEmpty` is how a caller asks to show which. -->
<Story name="Empty, shown as unrecorded">
  <dl class="border-base-300 bg-base-200 w-80 border">
    <InfoboxRow label="Frost tolerance" showEmpty />
  </dl>
</Story>
