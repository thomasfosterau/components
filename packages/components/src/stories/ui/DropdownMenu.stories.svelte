<script module lang="ts">
  import { ChevronDown, LogOut, Settings, User } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import DropdownMenu from '../../lib/ui/DropdownMenu.svelte';
  import MenuCheckboxItem from '../../lib/ui/MenuCheckboxItem.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';
  import MenuRadioGroup from '../../lib/ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../../lib/ui/MenuRadioItem.svelte';
  import MenuSeparator from '../../lib/ui/MenuSeparator.svelte';
  import MenuSub from '../../lib/ui/MenuSub.svelte';

  const { Story } = defineMeta({
    title: 'UI/DropdownMenu',
    component: DropdownMenu,
    parameters: {
      docs: {
        description: {
          component:
            'An application menu on bits-ui: `aria-haspopup`, arrow-key roving focus, typeahead, Escape, focus return. It takes the same `MenuItem` / `MenuSeparator` children as `Menu`, and is the only one of the menu components that loads bits-ui’s dropdown runtime.',
        },
      },
    },
  });
</script>

<Story name="Account menu">
  <div class="flex justify-end p-10">
    <DropdownMenu label="Account">
      {#snippet trigger({ props })}
        <Button {...props} variant="ghost">
          Ada Lovelace
          <ChevronDown class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
      <MenuItem href="/account">
        {#snippet icon()}<User class="size-5" />{/snippet}
        Your profile
      </MenuItem>
      <MenuItem href="/settings">
        {#snippet icon()}<Settings class="size-5" />{/snippet}
        Settings
      </MenuItem>
      <MenuSeparator />
      <MenuItem onSelect={() => undefined}>
        {#snippet icon()}<LogOut class="size-5" />{/snippet}
        Sign out
      </MenuItem>
    </DropdownMenu>
  </div>
</Story>

<Story name="Choices and a submenu">
  <div class="flex justify-end p-10">
    <DropdownMenu label="View">
      {#snippet trigger({ props })}
        <Button {...props} variant="ghost">
          View
          <ChevronDown class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
      <MenuCheckboxItem checked>Show archived</MenuCheckboxItem>
      <MenuSeparator />
      <MenuRadioGroup label="Density" value="comfortable">
        <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
        <MenuRadioItem value="compact">Compact</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuSub label="Group by">
        <MenuItem onSelect={() => undefined}>Bed</MenuItem>
        <MenuItem onSelect={() => undefined}>Family</MenuItem>
      </MenuSub>
    </DropdownMenu>
  </div>
</Story>
