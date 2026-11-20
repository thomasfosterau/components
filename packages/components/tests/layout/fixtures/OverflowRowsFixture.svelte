<!-- Test fixture: Breadcrumbs and links-mode Tabs with `overflow`, each in a narrow frame. Without daisyUI the list markers would sit over the neighbouring crumb and catch clicks. -->
<script lang="ts">
  import Breadcrumbs from '../../../src/lib/layout/Breadcrumbs.svelte';
  import Tabs from '../../../src/lib/layout/Tabs.svelte';

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Elections and referendums', href: '/elections' },
    { label: 'Federal election 2025', href: '/elections/2025' },
    { label: 'House of Representatives', href: '/elections/2025/house' },
    { label: 'Division of Kingsford Smith', href: '/elections/2025/house/kingsford-smith' },
    { label: 'Booths' },
  ];

  const tabs = Array.from({ length: 8 }, (_, i) => ({
    value: `section-${i + 1}`,
    label: `Section number ${i + 1}`,
    href: `/sections/${i + 1}`,
  }));
</script>

<div style="width: 280px;">
  <Breadcrumbs items={crumbs} overflow />
</div>
<div style="width: 320px;">
  <Tabs mode="links" items={tabs} value="section-7" label="Sections" overflow />
</div>

<style>
  :global(nav ol) {
    list-style: none;
  }
</style>
