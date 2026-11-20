<!-- @component
`DashboardGrid`'s controls: the Edit toggle, and in edit mode Add widget and Reset layout. Internal.
-->
<script lang="ts">
  import { Plus, RotateCcw } from '@lucide/svelte';
  import type { Attachment } from 'svelte/attachments';
  import ConfirmDialog from '../feedback/ConfirmDialog.svelte';
  import Button from '../ui/Button.svelte';
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import ToggleButton from '../ui/ToggleButton.svelte';

  interface Props {
    editing: boolean;
    onEditingChange: (editing: boolean) => void;
    hidden: readonly { readonly id: string; readonly title: string }[];
    canReset: boolean;
    editLabel: string;
    addLabel: string;
    resetLabel: string;
    resetTitle: string;
    resetDescription: string;
    resetConfirmLabel: string;
    cancelLabel: string;
    registerAdd: Attachment<HTMLElement>;
    onAdd: (id: string) => void;
    onReset: () => void;
  }

  let {
    editing,
    onEditingChange,
    hidden,
    canReset,
    editLabel,
    addLabel,
    resetLabel,
    resetTitle,
    resetDescription,
    resetConfirmLabel,
    cancelLabel,
    registerAdd,
    onAdd,
    onReset,
  }: Props = $props();
</script>

{#snippet plus()}<Plus class="size-4" />{/snippet}
{#snippet undo()}<RotateCcw class="size-4" />{/snippet}

<div class="flex flex-wrap items-center justify-end gap-2">
  {#if editing}
    <DropdownMenu label={addLabel}>
      {#snippet trigger({ props })}
        <Button
          {...props}
          {@attach registerAdd}
          size="sm"
          variant="ghost"
          icon={plus}
          disabled={hidden.length === 0}
        >
          {addLabel}
        </Button>
      {/snippet}
      {#each hidden as tile (tile.id)}
        <MenuItem onSelect={() => onAdd(tile.id)}>{tile.title}</MenuItem>
      {/each}
    </DropdownMenu>
    {#if canReset}
      <ConfirmDialog
        title={resetTitle}
        description={resetDescription}
        confirmLabel={resetConfirmLabel}
        {cancelLabel}
        tone="warning"
        onConfirm={async () => onReset()}
      >
        {#snippet trigger({ props })}
          <Button {...props} size="sm" variant="ghost" icon={undo}>{resetLabel}</Button>
        {/snippet}
      </ConfirmDialog>
    {/if}
  {/if}
  <ToggleButton pressed={editing} onPressedChange={onEditingChange} size="sm" variant="outline">
    {editLabel}
  </ToggleButton>
</div>
