<!-- `MenuGroup`, shortcut hints and a destructive item in a `DropdownMenu`,
     and `MenuGroup` in a navigation `Menu`. -->
<script lang="ts">
  import DropdownMenu from '../../../src/lib/ui/DropdownMenu.svelte';
  import Menu from '../../../src/lib/ui/Menu.svelte';
  import MenuGroup from '../../../src/lib/ui/MenuGroup.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';

  interface Props {
    onSelect?: ((name: string) => void) | undefined;
  }

  let { onSelect }: Props = $props();
</script>

<DropdownMenu label="Garden">
  {#snippet trigger({ props })}
    <button {...props} type="button">Garden actions</button>
  {/snippet}
  <MenuGroup label="Edit">
    <MenuItem hotkey="$mod+d" onSelect={() => onSelect?.('duplicate')}>Duplicate</MenuItem>
    <MenuItem hotkey="?">Help</MenuItem>
    <MenuItem hotkey={['g', 'b']}>Go to beds</MenuItem>
  </MenuGroup>
  <MenuGroup label="Danger zone" showLabel={false}>
    <MenuItem tone="error" onSelect={() => onSelect?.('delete')}>Delete garden…</MenuItem>
  </MenuGroup>
</DropdownMenu>

<Menu label="Sections">
  <MenuGroup label="Records">
    <MenuItem href="/plants">Plants</MenuItem>
    <MenuItem href="/beds">Beds</MenuItem>
  </MenuGroup>
</Menu>
