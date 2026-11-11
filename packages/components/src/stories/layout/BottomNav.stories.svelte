<script module lang="ts">
  import { Bell, Leaf, Sprout, User } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BottomNav from '../../lib/layout/BottomNav.svelte';
  import BottomNavItem from '../../lib/layout/BottomNavItem.svelte';

  const { Story } = defineMeta({
    title: 'Layout/BottomNav',
    component: BottomNav,
    parameters: {
      docs: {
        description: {
          component:
            'The phone’s primary navigation on daisyUI `dock`: three to five destinations, each an icon over its label, the current one `aria-current="page"`. Pair it with `Sidebar` by breakpoint (`class="sm:hidden"` here, `hidden sm:block` there). Shown with `fixed={false}` so it sits in the canvas.',
        },
      },
    },
  });
</script>

{#snippet gardens()}<Sprout class="size-5" />{/snippet}
{#snippet taxa()}<Leaf class="size-5" />{/snippet}
{#snippet notifications()}<Bell class="size-5" />{/snippet}
{#snippet account()}<User class="size-5" />{/snippet}

<Story name="Four destinations">
  <BottomNav fixed={false}>
    <BottomNavItem href="/gardens" label="Gardens" current icon={gardens} />
    <BottomNavItem href="/taxa" label="Taxa" icon={taxa} />
    <BottomNavItem href="/notifications" label="Notifications" badge={3} icon={notifications} />
    <BottomNavItem href="/account" label="Account" icon={account} />
  </BottomNav>
</Story>

<Story name="Small">
  <BottomNav fixed={false} size="sm">
    <BottomNavItem href="/gardens" label="Gardens" current icon={gardens} />
    <BottomNavItem href="/taxa" label="Taxa" icon={taxa} />
    <BottomNavItem href="/account" label="Account" icon={account} />
  </BottomNav>
</Story>
