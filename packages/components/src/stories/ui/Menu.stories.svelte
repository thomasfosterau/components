<script module lang="ts">
  import { ChevronDown, Leaf, LogOut, Settings, Sprout, User } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import Menu from '../../lib/ui/Menu.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../lib/ui/MenuSeparator.svelte';

  const { Story } = defineMeta({
    title: 'UI/Menu',
    component: Menu,
    parameters: {
      docs: {
        description: {
          component:
            'One component over the two things daisyUI calls a `menu`. `nav` mode is site navigation — a landmark, a list, links, and `aria-current="page"` on the current one, all reachable with Tab alone. `dropdown` mode is an application menu on bits-ui: `aria-haspopup`, arrow-key roving focus, typeahead, Escape, focus return.',
        },
      },
    },
  });
</script>

<Story name="Navigation">
  <div class="bg-base-100 max-w-xs rounded-box p-2">
    <Menu label="Primary">
      <MenuItem href="/gardens" current>
        {#snippet icon()}<Sprout class="size-5" />{/snippet}
        Gardens
      </MenuItem>
      <MenuItem href="/organisms">
        {#snippet icon()}<Leaf class="size-5" />{/snippet}
        Organisms
      </MenuItem>
      <MenuItem href="/taxa">Taxa</MenuItem>
      <MenuSeparator />
      <MenuItem href="/account">Account</MenuItem>
      <MenuItem href="/admin" disabled>Moderation</MenuItem>
    </Menu>
  </div>
</Story>

<Story name="Dropdown">
  <div class="flex justify-end p-10">
    <Menu mode="dropdown" label="Account">
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
    </Menu>
  </div>
</Story>
