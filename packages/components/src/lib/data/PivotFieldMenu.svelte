<!--
  PivotFieldMenu — one field in `PivotFields`: a button opening its menu of
  moves, an optional aggregate choice, and Remove.
-->
<script lang="ts">
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import MenuRadioGroup from '../ui/MenuRadioGroup.svelte';
  import MenuRadioItem from '../ui/MenuRadioItem.svelte';
  import MenuSeparator from '../ui/MenuSeparator.svelte';
  import type { PivotFieldAction } from './pivot-fields.ts';

  interface Props {
    text: string;
    menuLabel: string;
    actions: readonly PivotFieldAction[];
    /** The aggregate choice, for a measure. */
    choice?:
      | {
          readonly label: string;
          readonly value: string;
          readonly options: readonly { readonly value: string; readonly label: string }[];
          readonly change: (value: string) => void;
        }
      | undefined;
    /** Remove, when the field is placed. */
    remove?: PivotFieldAction | undefined;
    /** Dashed, for a field not yet placed. */
    unplaced?: boolean | undefined;
  }

  let { text, menuLabel, actions, choice, remove, unplaced = false }: Props = $props();
</script>

<DropdownMenu label={menuLabel} align="start">
  {#snippet trigger({ props })}
    <button {...props} type="button" class={['btn btn-sm', unplaced && 'btn-dash']}>{text}</button>
  {/snippet}
  {#each actions as action (action.label)}
    <MenuItem disabled={action.disabled} onSelect={action.run}>{action.label}</MenuItem>
  {/each}
  {#if choice}
    <MenuSeparator />
    <MenuRadioGroup label={choice.label} value={choice.value} onValueChange={choice.change}>
      {#each choice.options as option (option.value)}
        <MenuRadioItem value={option.value}>{option.label}</MenuRadioItem>
      {/each}
    </MenuRadioGroup>
  {/if}
  {#if remove}
    <MenuSeparator />
    <MenuItem onSelect={remove.run}>{remove.label}</MenuItem>
  {/if}
</DropdownMenu>
