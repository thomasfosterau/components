<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import InfoboxRow from '../../lib/infobox/InfoboxRow.svelte';
  import InfoboxSection from '../../lib/infobox/InfoboxSection.svelte';

  const { Story } = defineMeta({
    title: 'Infobox/InfoboxSection',
    component: InfoboxSection,
    tags: ['autodocs'],
    parameters: {
      docs: {
        description: {
          component: 'A titled group of `InfoboxRow`s. Owns the `<dl>` — rows contribute the `dt`/`dd` pairs.',
        },
      },
    },
  });
</script>

<Story name="Titled">
  <div class="border-base-300 bg-base-200 w-80 border">
    <InfoboxSection title="Classification">
      <InfoboxRow label="Family" value="Solanaceae" />
      <InfoboxRow label="Genus" value="Solanum" />
    </InfoboxSection>
  </div>
</Story>

<Story name="Untitled">
  <div class="border-base-300 bg-base-200 w-80 border">
    <InfoboxSection>
      <InfoboxRow label="Area" value="4.2 m²" />
      <InfoboxRow label="Containers" value="6" />
    </InfoboxSection>
  </div>
</Story>

<Story name="Mixed rows">
  <div class="border-base-300 bg-base-200 w-80 border">
    <InfoboxSection>
      <InfoboxRow label="Plain" value="A string value" />
      <InfoboxRow label="Rich">
        <span class="badge badge-success badge-sm">Accepted</span>
      </InfoboxRow>
      <InfoboxRow label="Unrecorded" showEmpty />
    </InfoboxSection>
  </div>
</Story>
