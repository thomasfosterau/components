<script lang="ts">
  import Heading from '../../../src/lib/ui/Heading.svelte';
  import TableOfContents from '../../../src/lib/layout/TableOfContents.svelte';

  interface Props {
    collapseBelow?: 'md' | 'lg' | 'xl' | false | undefined;
  }

  let { collapseBelow }: Props = $props();
</script>

<div style="display: flex; gap: 2rem; align-items: flex-start">
  <TableOfContents container="#toc-article" {collapseBelow} sticky />
  <article id="toc-article" style="flex: 1">
    <Heading level={2} id="section-1" anchor>Section 1</Heading>
    <div style="height: 1200px"></div>
    <Heading level={2} id="section-2">Section 2</Heading>
    <div style="height: 600px"></div>
    <Heading level={3} id="section-2a">Section 2a</Heading>
    <div style="height: 1200px"></div>
    <Heading level={2} id="section-3">Section 3</Heading>
    <div style="height: 1200px"></div>
    <Heading level={4} id="ignored">Too deep</Heading>
  </article>
</div>
