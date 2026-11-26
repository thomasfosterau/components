<!-- Test fixture: panels-mode Tabs with `scrollButtons` in a frame of a given width and direction. -->
<script lang="ts">
  import Tabs from '../../../src/lib/layout/Tabs.svelte';

  interface Props {
    width: number;
    count?: number;
    dir?: 'ltr' | 'rtl';
  }

  let { width, count = 8, dir = 'ltr' }: Props = $props();

  const items = $derived(
    Array.from({ length: count }, (_, i) => ({
      value: `section-${i + 1}`,
      label: `Section number ${i + 1}`,
    })),
  );
</script>

<div {dir} style:width={`${width}px`}>
  <Tabs {items} label="Sections" scrollButtons />
</div>
