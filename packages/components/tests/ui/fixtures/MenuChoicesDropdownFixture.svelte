<!-- The checkbox and radio items in a `DropdownMenu`, the other bits-ui menu
     that lends them parts. -->
<script lang="ts">
  import DropdownMenu from '../../../src/lib/ui/DropdownMenu.svelte';
  import Menu from '../../../src/lib/ui/Menu.svelte';
  import MenuCheckboxItem from '../../../src/lib/ui/MenuCheckboxItem.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import MenuRadioGroup from '../../../src/lib/ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../../../src/lib/ui/MenuRadioItem.svelte';
  import MenuSub from '../../../src/lib/ui/MenuSub.svelte';
</script>

<DropdownMenu label="View">
  {#snippet trigger({ props })}
    <button {...props} type="button">View options</button>
  {/snippet}
  <MenuCheckboxItem checked>Show archived</MenuCheckboxItem>
  <MenuRadioGroup label="Density" value="comfortable">
    <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
    <MenuRadioItem value="compact">Compact</MenuRadioItem>
  </MenuRadioGroup>
  <MenuSub label="Group by">
    <MenuItem>Bed</MenuItem>
    <MenuItem>Family</MenuItem>
  </MenuSub>
</DropdownMenu>

<Menu label="Primary">
  <MenuItem href="/gardens">Gardens</MenuItem>
  <MenuCheckboxItem>Not in a navigation list</MenuCheckboxItem>
  <MenuSub label="Nor a submenu"><MenuItem>Hidden</MenuItem></MenuSub>
</Menu>
