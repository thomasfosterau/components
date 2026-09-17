<script module lang="ts">
  import { Leaf, Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Sidebar from '../../lib/layout/Sidebar.svelte';
  import Menu from '../../lib/ui/Menu.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Sidebar',
    component: Sidebar,
    parameters: {
      docs: {
        description: {
          component:
            'The app shell’s standing navigation column — a thin composition of `Menu mode="nav"` with a brand region above and an account region below. Deliberately NOT wrapped in an `<aside>`: `complementary` is the wrong landmark for a site’s primary navigation, and it would put a second landmark around the `navigation` one.',
        },
      },
    },
  });
</script>

<Story name="Primary navigation">
  <div class="flex h-96">
    <Sidebar>
      {#snippet brand()}
        <a href="/" rel="home" class="text-primary text-2xl font-bold">Gardeneria</a>
      {/snippet}
      <MenuItem href="/gardens" current>
        {#snippet icon()}<Sprout class="size-5" />{/snippet}
        Gardens
      </MenuItem>
      <MenuItem href="/organisms">
        {#snippet icon()}<Leaf class="size-5" />{/snippet}
        Organisms
      </MenuItem>
      <MenuItem href="/taxa">Taxa</MenuItem>
      <MenuItem href="/posts">Posts</MenuItem>
      {#snippet footer()}
        <Menu label="Account">
          <MenuItem href="/account">Ada Lovelace</MenuItem>
        </Menu>
      {/snippet}
    </Sidebar>
  </div>
</Story>

<Story name="With a visible title">
  <div class="flex h-96">
    <Sidebar title="Browse">
      <MenuItem href="/gardens">Gardens</MenuItem>
      <MenuItem href="/taxa">Taxa</MenuItem>
      <MenuItem href="/anatomy">Anatomy</MenuItem>
    </Sidebar>
  </div>
</Story>
