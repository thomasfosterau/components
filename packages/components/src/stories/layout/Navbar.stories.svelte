<script module lang="ts">
  import { Search } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Navbar from '../../lib/layout/Navbar.svelte';
  import Menu from '../../lib/ui/Menu.svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../lib/ui/MenuSeparator.svelte';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Navbar',
    component: Navbar,
    parameters: {
      docs: {
        description: {
          component:
            'The site banner: `<header>` (the `banner` landmark) around a named `<nav>`, with `start` / `center` / `end` regions the app fills. The responsive toggle is bits-ui `Collapsible`, so the button carries a real `aria-expanded` and an `aria-controls` pointing at the panel — which a `<details>` cannot express. Narrow the viewport to see it.',
        },
      },
    },
  });
</script>

<Story name="Brand, links and account">
  <Navbar>
    {#snippet start()}
      <a href="/" rel="home" class="text-primary text-xl font-bold">Blog</a>
    {/snippet}
    {#snippet center()}
      <Menu label="Sections" class="menu-horizontal">
        <MenuItem href="/posts">Posts</MenuItem>
        <MenuItem href="/tags">Tags</MenuItem>
        <MenuItem href="/authors">Authors</MenuItem>
      </Menu>
    {/snippet}
    {#snippet end()}
      <form action="/search" method="get" class="hidden sm:block">
        <label class="input input-sm">
          <Search class="size-4 opacity-60" aria-hidden="true" />
          <input type="search" name="q" placeholder="Search" aria-label="Search the site" />
        </label>
      </form>
      <Menu mode="dropdown" label="Account">
        {#snippet trigger({ props })}
          <Button {...props} variant="ghost" size="sm">Ada Lovelace</Button>
        {/snippet}
        <MenuItem href="/account">Your profile</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => undefined}>Sign out</MenuItem>
      </Menu>
    {/snippet}
  </Navbar>
</Story>

<Story name="With the responsive panel">
  <Navbar menuLabel="Open the site menu">
    {#snippet start()}
      <a href="/" rel="home" class="text-primary text-xl font-bold">Blog</a>
    {/snippet}
    {#snippet menu()}
      <Menu label="Sections">
        <MenuItem href="/posts">Posts</MenuItem>
        <MenuItem href="/tags">Tags</MenuItem>
        <MenuItem href="/authors">Authors</MenuItem>
      </Menu>
    {/snippet}
  </Navbar>
</Story>
