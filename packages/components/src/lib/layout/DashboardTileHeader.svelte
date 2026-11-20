<!-- @component
A `DashboardGrid` tile's title row: its heading, and in edit mode its Move handle and options menu. Internal.
-->
<script lang="ts">
  import { EllipsisVertical, GripVertical } from '@lucide/svelte';
  import type { Attachment } from 'svelte/attachments';
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import IconButtonCore from '../ui/IconButtonCore.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import MenuRadioGroup from '../ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../ui/MenuRadioItem.svelte';
  import MenuSeparator from '../ui/MenuSeparator.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';

  type Where = 'up' | 'down' | 'start' | 'end';

  interface Props {
    title: string;
    headingId: string;
    headingLevel: HeadingLevel;
    editing: boolean;
    /** This tile is held by its handle. */
    held: boolean;
    /** Some tile is held, so the menus wait. */
    busy: boolean;
    first: boolean;
    last: boolean;
    handleLabel: string;
    menuLabel: string;
    instructionsId: string;
    sizes: readonly { readonly value: string; readonly label: string }[];
    size: string;
    sizeLabel: string;
    moveLabels: Readonly<Record<Where, string>>;
    removeLabel: string;
    registerHandle: Attachment<HTMLElement>;
    registerTrigger: Attachment<HTMLElement>;
    onHandleClick: (event: MouseEvent) => void;
    onHandleKeydown: (event: KeyboardEvent) => void;
    onHandleBlur: () => void;
    onHandlePointerDown: (event: PointerEvent) => void;
    onSize: (size: string) => void;
    onMove: (where: Where) => void;
    onRemove: () => void;
  }

  let {
    title,
    headingId,
    headingLevel,
    editing,
    held,
    busy,
    first,
    last,
    handleLabel,
    menuLabel,
    instructionsId,
    sizes,
    size,
    sizeLabel,
    moveLabels,
    removeLabel,
    registerHandle,
    registerTrigger,
    onHandleClick,
    onHandleKeydown,
    onHandleBlur,
    onHandlePointerDown,
    onSize,
    onMove,
    onRemove,
  }: Props = $props();

  const moves = $derived<{ where: Where; disabled: boolean }[]>([
    { where: 'up', disabled: first },
    { where: 'down', disabled: last },
    { where: 'start', disabled: first },
    { where: 'end', disabled: last },
  ]);
</script>

{#snippet grip()}<GripVertical class="size-4" />{/snippet}
{#snippet more()}<EllipsisVertical class="size-4" />{/snippet}

<div class="flex items-center gap-1" style:display="flex" style:align-items="center">
  {#if editing}
    <IconButtonCore
      {@attach registerHandle}
      label={handleLabel}
      icon={grip}
      size="sm"
      aria-describedby={instructionsId}
      aria-pressed={held ? 'true' : 'false'}
      class={['touch-none', held ? 'cursor-grabbing' : 'cursor-grab']}
      onclick={onHandleClick}
      onkeydown={onHandleKeydown}
      onblur={onHandleBlur}
      onpointerdown={onHandlePointerDown}
    />
  {/if}
  <svelte:element
    this={`h${headingLevel}`}
    id={headingId}
    class="min-w-0 flex-1 truncate font-semibold"
    style:flex="1"
  >
    {title}
  </svelte:element>
  {#if editing}
    <DropdownMenu label={menuLabel}>
      {#snippet trigger({ props })}
        <IconButtonCore
          {...props}
          {@attach registerTrigger}
          label={menuLabel}
          icon={more}
          size="sm"
          disabled={busy}
        />
      {/snippet}
      {#if sizes.length > 1}
        <MenuRadioGroup label={sizeLabel} value={size} onValueChange={onSize}>
          {#each sizes as option (option.value)}
            <MenuRadioItem value={option.value}>{option.label}</MenuRadioItem>
          {/each}
        </MenuRadioGroup>
        <MenuSeparator />
      {/if}
      {#each moves as move (move.where)}
        <MenuItem disabled={move.disabled} onSelect={() => onMove(move.where)}>
          {moveLabels[move.where]}
        </MenuItem>
      {/each}
      <MenuSeparator />
      <MenuItem onSelect={onRemove}>{removeLabel}</MenuItem>
    </DropdownMenu>
  {/if}
</div>
