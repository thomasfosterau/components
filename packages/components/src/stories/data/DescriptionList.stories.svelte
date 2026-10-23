<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DescriptionList from '../../lib/data/DescriptionList.svelte';
  import DescriptionRow from '../../lib/data/DescriptionRow.svelte';
  import DateTime from '../../lib/formatting/DateTime.svelte';
  import Link from '../../lib/ui/Link.svelte';

  const { Story } = defineMeta({
    title: 'Data/DescriptionList',
    component: DescriptionList,
    parameters: {
      docs: {
        description: {
          component:
            'A real `<dl>`: the `<dt>`/`<dd>` pairing is what makes the label / value association exist for a screen reader. A row with nothing in it renders nothing at all — an empty `<dd>` claims the page looked and found a blank — unless `showEmpty` says the absence is the point.',
        },
      },
    },
  });
</script>

<Story name="Grid">
  <DescriptionList>
    <DescriptionRow label="Family" value="Rosaceae" />
    <DescriptionRow label="Sown" value="14 September 2026" />
    <DescriptionRow label="Seedlings" value={6} />
    <DescriptionRow label="Harvested" value="" />
  </DescriptionList>
</Story>

<Story name="Card, with markup values">
  <DescriptionList variant="card">
    <DescriptionRow label="Captured">
      <DateTime value="2026-06-02T09:14:00Z" dateStyle="long" locales="en-AU" />
    </DescriptionRow>
    <DescriptionRow label="Dimensions" value="4032 × 3024" />
    <DescriptionRow label="Licence">
      <Link href="/licences/cc-by-4.0">CC BY 4.0</Link>
    </DescriptionRow>
    <DescriptionRow label="Size" value="3.1 MB" />
  </DescriptionList>
</Story>

<Story name="Mono, for identifiers">
  <DescriptionList variant="card" mono>
    <DescriptionRow label="Formula" value="C8H10N4O2" />
    <DescriptionRow label="InChIKey" value="RYYVLZVUVIJVGH-UHFFFAOYSA-N" />
    <DescriptionRow label="CAS" value="58-08-2" />
  </DescriptionList>
</Story>

<Story name="Divided">
  <DescriptionList variant="divided">
    <DescriptionRow label="Owner" value="Ada Lovelace" />
    <DescriptionRow label="Visibility" value="Private" />
    <DescriptionRow label="Created" value="12 April 2024" />
  </DescriptionList>
</Story>

<Story name="Inline">
  <DescriptionList variant="inline">
    <DescriptionRow label="Beds" value={9} />
    <DescriptionRow label="Plants" value={214} />
    <DescriptionRow label="Zone" value="9b" />
  </DescriptionList>
</Story>

<Story name="Bare, in the caller's own grid">
  <!-- `bare` adds no layout: the caller's class lays the <dl> out, and each row's
       <dt>/<dd> sits directly in it beside the caller's own pairs. -->
  <DescriptionList variant="bare" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
    <dt class="text-base-content/60 text-sm">Name</dt>
    <dd class="text-sm">Royal Botanic Garden</dd>
    <DescriptionRow label="Founded" value={1816} />
    <DescriptionRow label="Website">
      <Link href="https://example.org">example.org</Link>
    </DescriptionRow>
  </DescriptionList>
</Story>

<Story name="Showing the absences">
  <!-- A specimen record whose blank fields are what the reader came to check. -->
  <DescriptionList variant="divided" showEmpty emptyLabel="not recorded">
    <DescriptionRow label="Collector" value="J. Banks" />
    <DescriptionRow label="Elevation" value="" />
    <DescriptionRow label="Habitat" value="" />
    <DescriptionRow label="Collected" value="1770" />
  </DescriptionList>
</Story>
