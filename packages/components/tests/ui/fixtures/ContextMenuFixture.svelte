<script lang="ts">
  import ContextMenu from '../../../src/lib/ui/ContextMenu.svelte';
  import MenuCheckboxItem from '../../../src/lib/ui/MenuCheckboxItem.svelte';
  import MenuItem from '../../../src/lib/ui/MenuItem.svelte';
  import MenuRadioGroup from '../../../src/lib/ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../../../src/lib/ui/MenuRadioItem.svelte';
  import MenuSeparator from '../../../src/lib/ui/MenuSeparator.svelte';
  import MenuSub from '../../../src/lib/ui/MenuSub.svelte';

  interface Props {
    disabled?: boolean | undefined;
    onRename?: (() => void) | undefined;
    pinned?: boolean | undefined;
    sort?: string | undefined;
  }

  let {
    disabled = false,
    onRename,
    pinned = $bindable(false),
    sort = $bindable('name'),
  }: Props = $props();
</script>

<ul>
  <ContextMenu label="Actions for Rosa canina" {disabled}>
    {#snippet trigger({ props })}
      <li {...props}>Rosa canina</li>
    {/snippet}
    <MenuItem onSelect={onRename}>Rename</MenuItem>
    <MenuItem href="/taxa/rosa-canina">Open</MenuItem>
    <MenuSeparator />
    <MenuCheckboxItem bind:checked={pinned}>Pinned</MenuCheckboxItem>
    <MenuRadioGroup label="Sort by" bind:value={sort}>
      <MenuRadioItem value="name">Name</MenuRadioItem>
      <MenuRadioItem value="date">Date added</MenuRadioItem>
    </MenuRadioGroup>
    <MenuSub label="Move to">
      <MenuItem>Bed 1</MenuItem>
      <MenuItem>Bed 2</MenuItem>
    </MenuSub>
  </ContextMenu>
</ul>
<p data-testid="state">{pinned ? 'pinned' : 'unpinned'} {sort}</p>
