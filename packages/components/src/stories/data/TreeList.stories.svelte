<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import TreeList from '../../lib/data/TreeList.svelte';
  import TreeListItem from '../../lib/data/TreeListItem.svelte';
  import Link from '../../lib/ui/Link.svelte';

  const { Story } = defineMeta({
    title: 'Data/TreeList',
    component: TreeList,
    parameters: {
      docs: {
        description: {
          component:
            'Native `<details>`/`<summary>` nesting, deliberately not an ARIA `tree`: the element already gives the disclosure semantics, the keyboard and find-in-page inside collapsed content, and `role="tree"` would commit the caller to roving tabindex and typeahead over arbitrary content.',
        },
      },
    },
  });
</script>

<Story name="Taxonomy">
  <TreeList title="Rosaceae">
    <TreeListItem>
      <TreeList title="Rosa">
        <TreeListItem><Link href="/taxa/rosa-canina">Rosa canina</Link></TreeListItem>
        <TreeListItem><Link href="/taxa/rosa-rugosa">Rosa rugosa</Link></TreeListItem>
      </TreeList>
    </TreeListItem>
    <TreeListItem>
      <TreeList title="Fragaria" open={false}>
        <TreeListItem><Link href="/taxa/fragaria-vesca">Fragaria vesca</Link></TreeListItem>
      </TreeList>
    </TreeListItem>
    <TreeListItem><Link href="/taxa/malus-domestica">Malus domestica</Link></TreeListItem>
  </TreeList>
</Story>

<Story name="Folded">
  <TreeList title="Amaryllidaceae" open={false}>
    <TreeListItem>Allium sativum</TreeListItem>
    <TreeListItem>Allium cepa</TreeListItem>
  </TreeList>
</Story>
