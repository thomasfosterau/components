<script module lang="ts">
  import { Copy, Pencil, Trash2 } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ContextMenu from '../../lib/ui/ContextMenu.svelte';
  import MenuCheckboxItem from '../../lib/ui/MenuCheckboxItem.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';
  import MenuRadioGroup from '../../lib/ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../../lib/ui/MenuRadioItem.svelte';
  import MenuSeparator from '../../lib/ui/MenuSeparator.svelte';
  import MenuSub from '../../lib/ui/MenuSub.svelte';

  const { Story } = defineMeta({
    title: 'UI/ContextMenu',
    component: ContextMenu,
    parameters: {
      docs: {
        description: {
          component:
            '`@thomasfosterau/components/context-menu`: a menu at the pointer on right-click, long-press, or Shift+F10 / the Menu key on the focused region. It takes the same `MenuItem` / `MenuSeparator` children as `DropdownMenu`, plus `MenuCheckboxItem`, `MenuRadioGroup` / `MenuRadioItem` and `MenuSub`. Never the only route to an action: put each one somewhere visible too.',
        },
      },
    },
  });

  const plants = ['Rosa canina', 'Solanum lycopersicum', 'Lavandula angustifolia'];
</script>

<Story name="Plant list">
  <ul class="bg-base-100 rounded-box divide-base-300 max-w-sm divide-y border">
    {#each plants as plant (plant)}
      <ContextMenu label={`Actions for ${plant}`}>
        {#snippet trigger({ props })}
          <li {...props} class="focus-visible:outline-primary px-4 py-3 italic focus-visible:outline-2">
            {plant}
          </li>
        {/snippet}
        <MenuItem onSelect={() => undefined}>
          {#snippet icon()}<Pencil class="size-5" />{/snippet}
          Rename
        </MenuItem>
        <MenuItem onSelect={() => undefined}>
          {#snippet icon()}<Copy class="size-5" />{/snippet}
          Duplicate
        </MenuItem>
        <MenuSub label="Move to">
          <MenuItem onSelect={() => undefined}>Bed 1</MenuItem>
          <MenuItem onSelect={() => undefined}>Bed 2</MenuItem>
        </MenuSub>
        <MenuSeparator />
        <MenuCheckboxItem>Pinned</MenuCheckboxItem>
        <MenuRadioGroup label="Show as" value="name">
          <MenuRadioItem value="name">Scientific name</MenuRadioItem>
          <MenuRadioItem value="common">Common name</MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem onSelect={() => undefined}>
          {#snippet icon()}<Trash2 class="size-5" />{/snippet}
          Delete
        </MenuItem>
      </ContextMenu>
    {/each}
  </ul>
</Story>

<Story name="Disabled (the browser's menu shows)">
  <ContextMenu label="Actions" disabled>
    {#snippet trigger({ props })}
      <div {...props} class="bg-base-200 rounded-box max-w-sm p-6">Right-click here</div>
    {/snippet}
    <MenuItem>Never shown</MenuItem>
  </ContextMenu>
</Story>
