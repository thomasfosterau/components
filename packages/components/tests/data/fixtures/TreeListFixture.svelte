<!-- A two-level `TreeList`; the nested subtree is what proves the disclosure
     nests rather than flattening. -->
<script lang="ts">
  import TreeList from '../../../src/lib/data/TreeList.svelte';
  import TreeListItem from '../../../src/lib/data/TreeListItem.svelte';

  interface Props {
    open?: boolean;
  }

  let { open = true }: Props = $props();
</script>

<TreeList title="Rosaceae" {open}>
  <TreeListItem>
    <TreeList title="Rosa" open={false}>
      <TreeListItem>Rosa canina</TreeListItem>
    </TreeList>
  </TreeListItem>
  <TreeListItem>Fragaria</TreeListItem>
</TreeList>
