<script module lang="ts">
  import { EllipsisVertical, Pencil, Trash2, X } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import IconButton from '../../lib/ui/IconButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/IconButton',
    component: IconButton,
    parameters: {
      docs: {
        description: {
          component:
            'An icon-only button or link. `label` is required: it is the accessible name, and the tooltip shows it to pointer users too, without repeating it as a description. The hit target is at least 24×24 at every size.',
        },
      },
    },
  });
</script>

{#snippet close()}<X class="size-4" />{/snippet}
{#snippet edit()}<Pencil class="size-4" />{/snippet}
{#snippet more()}<EllipsisVertical class="size-4" />{/snippet}
{#snippet trash()}<Trash2 class="size-4" />{/snippet}

<Story name="Labelled, with a tooltip">
  <div class="flex gap-2 p-8">
    <IconButton label="Close" icon={close} />
    <IconButton label="Edit" icon={edit} />
    <IconButton label="More actions" icon={more} />
  </div>
</Story>

<Story name="Tones, variants, shapes and sizes">
  <div class="flex flex-wrap items-center gap-2 p-8">
    <IconButton label="Delete" icon={trash} tone="error" variant="soft" />
    <IconButton label="Edit" icon={edit} tone="primary" variant="solid" shape="circle" />
    <IconButton label="Close" icon={close} size="xs" />
    <IconButton label="Close" icon={close} size="lg" variant="outline" />
  </div>
</Story>

<Story name="Disabled, still discoverable">
  <!-- `aria-disabled` rather than `disabled`, so the name is still reachable
       by focus and hover; activation is swallowed. -->
  <div class="p-8">
    <IconButton label="Delete (you need edit access)" icon={trash} disabled />
  </div>
</Story>

<Story name="As a link">
  <div class="p-8">
    <IconButton label="Edit garden" icon={edit} href="/gardens/7/edit" />
  </div>
</Story>
