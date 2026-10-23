<!-- A `DescriptionList` with rows covering the three cases the empty rule
     turns on: a value, an empty string, and markup. -->
<script lang="ts">
  import DescriptionList from '../../../src/lib/data/DescriptionList.svelte';
  import DescriptionRow from '../../../src/lib/data/DescriptionRow.svelte';

  interface Props {
    variant?: 'grid' | 'card' | 'divided' | 'inline' | 'bare';
    class?: string;
    mono?: boolean;
    showEmpty?: boolean;
    emptyLabel?: string;
  }

  let {
    variant = 'grid',
    mono = false,
    showEmpty = false,
    emptyLabel,
    class: className,
  }: Props = $props();
</script>

<DescriptionList {variant} {mono} {showEmpty} {emptyLabel} class={className}>
  <DescriptionRow label="Formula" value="C8H10N4O2" />
  <DescriptionRow label="Collected" value="" />
  <DescriptionRow label="Licence">
    <a href="/licences/cc-by">CC BY 4.0</a>
  </DescriptionRow>
  <DescriptionRow label="Height" value={42} />
</DescriptionList>
