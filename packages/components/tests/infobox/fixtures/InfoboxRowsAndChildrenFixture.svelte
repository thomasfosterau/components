<!--
  Test fixture: `Infobox` given BOTH `rows` and `children` — the contract is
  that neither suppresses the other, so a test needs real markup in the
  `children` slot (a `.ts` test's `createRawSnippet` can't hold an
  `InfoboxSection`/`InfoboxRow` pair).
-->
<script lang="ts">
  import Infobox from '../../../src/lib/infobox/Infobox.svelte';
  import InfoboxRow from '../../../src/lib/infobox/InfoboxRow.svelte';
  import InfoboxSection from '../../../src/lib/infobox/InfoboxSection.svelte';
</script>

<Infobox title="Bed 3" rows={[{ kind: 'fact', label: 'Area', value: '4.2 m²' }]}>
  <InfoboxSection title="Notes">
    <InfoboxRow label="Last sown" value="14 September" />
  </InfoboxSection>
</Infobox>
