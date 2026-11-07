<script module lang="ts">
  import { Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Avatar from '../../lib/ui/Avatar.svelte';
  import AvatarGroup from '../../lib/ui/AvatarGroup.svelte';

  const { Story } = defineMeta({
    title: 'UI/Avatar',
    component: Avatar,
    parameters: {
      docs: {
        description: {
          component:
            'A picture of a person or thing, falling back to initials (or an icon) while it loads and when it fails. With `name` it is an `img` named once; without, it is decorative — use that when the name is adjacent text.',
        },
      },
    },
  });

  const PIXEL =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="%2394a3b8"/><circle cx="5" cy="4" r="2" fill="%23f8fafc"/></svg>';
</script>

{#snippet sprout()}<Sprout class="size-1/2" />{/snippet}

<Story name="Image, broken image and initials">
  <div class="flex items-center gap-4">
    <Avatar src={PIXEL} name="Ada Lovelace" />
    <Avatar src="/missing-upload.png" name="Grace Hopper" />
    <Avatar name="Émile Zola" />
    <Avatar fallback={sprout} name="Allotment society" shape="rounded" />
  </div>
</Story>

<Story name="Sizes, shapes and presence">
  <div class="flex items-center gap-4">
    <Avatar name="Ada Lovelace" size="xs" />
    <Avatar name="Ada Lovelace" size="sm" shape="rounded" />
    <Avatar name="Ada Lovelace" size="lg" presence="online" />
    <Avatar name="Ada Lovelace" size="xl" shape="square" presence="offline" />
  </div>
</Story>

<Story name="Group with overflow">
  <AvatarGroup label="Bed 4 volunteers" overflow={3}>
    <Avatar name="Ada Lovelace" />
    <Avatar name="Grace Hopper" />
    <Avatar name="Katherine Johnson" />
  </AvatarGroup>
</Story>
