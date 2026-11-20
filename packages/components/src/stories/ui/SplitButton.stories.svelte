<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Download } from '@lucide/svelte';
  import MenuItem from '../../lib/ui/MenuItem.svelte';
  import MenuSeparator from '../../lib/ui/MenuSeparator.svelte';
  import SplitButton from '../../lib/ui/SplitButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/SplitButton',
    component: SplitButton,
    parameters: {
      docs: {
        description: {
          component:
            'A default action joined to a menu of alternatives: two Tab stops in a `join`. The main part is a `Button` (or `LinkButton`); the chevron is a menu button named by `menuLabel`, which should say what it holds. `primaryDisabled` leaves the alternatives reachable.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let saving = $state(false);
  const save = (): void => {
    saving = true;
    setTimeout(() => (saving = false), 1500);
  };
</script>

<Story name="Tones" asChild>
  <div class="flex flex-wrap gap-4">
    <SplitButton tone="primary" menuLabel="More save options" onclick={save} loading={saving}>
      Save
      {#snippet menu()}
        <MenuItem>Save as draft</MenuItem>
        <MenuItem>Save and publish</MenuItem>
      {/snippet}
    </SplitButton>
    <SplitButton variant="outline" menuLabel="More export formats">
      {#snippet icon()}<Download class="size-4" aria-hidden="true" />{/snippet}
      Export CSV
      {#snippet menu()}
        <MenuItem>Export JSON</MenuItem>
        <MenuItem>Export GeoJSON</MenuItem>
      {/snippet}
    </SplitButton>
    <SplitButton tone="error" size="sm" menuLabel="More delete options">
      Delete
      {#snippet menu()}
        <MenuItem>Archive instead</MenuItem>
        <MenuSeparator />
        <MenuItem>Delete with all photos</MenuItem>
      {/snippet}
    </SplitButton>
  </div>
</Story>

<Story name="Link main action" asChild>
  <SplitButton href="/beds/new" tone="primary" menuLabel="More ways to add a bed">
    New bed
    {#snippet menu()}
      <MenuItem href="/beds/import">Import from a plan</MenuItem>
      <MenuItem href="/beds/duplicate">Duplicate a bed</MenuItem>
    {/snippet}
  </SplitButton>
</Story>

<Story name="Primary disabled" asChild>
  <SplitButton tone="primary" primaryDisabled menuLabel="More save options">
    Save
    {#snippet menu()}
      <MenuItem>Revert changes</MenuItem>
      <MenuItem>Save a copy</MenuItem>
    {/snippet}
  </SplitButton>
</Story>

<Story name="Opens upward" asChild>
  <div class="pt-40">
    <SplitButton placement="top-start" menuLabel="More merge options">
      Merge
      {#snippet menu()}
        <MenuItem>Squash and merge</MenuItem>
        <MenuItem>Rebase and merge</MenuItem>
      {/snippet}
    </SplitButton>
  </div>
</Story>
