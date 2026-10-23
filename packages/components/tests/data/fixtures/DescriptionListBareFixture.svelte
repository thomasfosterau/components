<!-- A `bare` list laid out by its caller's own two-column grid, mixing a
     hand-written `<dt>`/`<dd>` pair with `DescriptionRow`s — the shape an
     app's identity list takes when one of its rows is markup it owns. -->
<script lang="ts">
  import DescriptionList from '../../../src/lib/data/DescriptionList.svelte';
  import DescriptionRow from '../../../src/lib/data/DescriptionRow.svelte';
</script>

<DescriptionList variant="bare" class="grid grid-cols-[auto_1fr] gap-x-4">
  <dt>Name</dt>
  <dd>Royal Botanic Garden</dd>
  <DescriptionRow label="Founded" value={1816} />
  <DescriptionRow label="Closed" value="" />
  <DescriptionRow label="Website">
    <a href="https://example.org">example.org</a>
  </DescriptionRow>
</DescriptionList>
