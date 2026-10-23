<script module lang="ts">
  import { ChevronDown, LogOut, Settings, User } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import DropdownMenu from '../../lib/ui/DropdownMenu.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../lib/ui/MenuSeparator.svelte';

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
