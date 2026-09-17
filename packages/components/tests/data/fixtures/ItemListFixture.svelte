<!-- `ItemList`'s `item` snippet needs real markup (a `LinkListItem` with
     props), which `createRawSnippet` cannot build — hence a fixture. -->
<script lang="ts">
  import ItemList from '../../../src/lib/data/ItemList.svelte';
  import LinkListItem from '../../../src/lib/data/LinkListItem.svelte';
  import type { LinkListItemData } from '../../../src/lib/data/list-item.ts';

  interface Props {
    items?: readonly LinkListItemData[];
    variant?: 'compact' | 'stacked' | 'grid' | 'cards';
    feed?: boolean;
    busy?: boolean;
    label?: string;
    emptyMessage?: string;
  }

  let {
    items = [
      { id: '1', href: '/gardens/1', title: 'Back bed', subtitle: 'Sown in March' },
      { id: '2', href: '/gardens/2', title: 'Herb spiral', badges: ['Private'] },
      { id: '3', href: '/gardens/3', title: 'Glasshouse' },
    ],
    variant = 'compact',
    feed = false,
    busy = false,
    label,
    emptyMessage,
  }: Props = $props();
</script>

<ItemList {items} {variant} {feed} {busy} {label} {emptyMessage} getKey={(item) => item.id}>
  {#snippet item(entry)}
    <LinkListItem
      href={entry.href}
      title={entry.title}
      subtitle={entry.subtitle}
      badges={entry.badges}
    />
  {/snippet}
</ItemList>
