<script module lang="ts">
  import { Leaf, Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
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
            'Site navigation — a landmark, a list, links, and `aria-current="page"` on the current one, all reachable with Tab alone. Imports nothing from bits-ui; an application menu behind a trigger is `DropdownMenu`, which takes the same `MenuItem`s.',
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
