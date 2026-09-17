<!--
  Test fixture: FormatList<string> instantiated directly in markup so
  TypeScript infers `T` from the concrete `items` prop, rather than through
  `render()`'s generic component parameter, which loses the inference.
-->
<script lang="ts">
  import FormatList from '../../../src/lib/formatting/FormatList.svelte';

  interface Props {
    items: readonly string[];
    locales?: string | readonly string[] | undefined;
    type?: Intl.ListFormatOptions['type'];
    style?: Intl.ListFormatOptions['style'];
  }

  let { items, locales, type, style }: Props = $props();
</script>

<p>
  <FormatList {items} {locales} {type} {style}>
    {#snippet children(item)}<span>{item}</span>{/snippet}
  </FormatList>
</p>
