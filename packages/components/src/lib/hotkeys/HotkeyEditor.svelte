<!-- @component
A settings table of every registered command and its shortcut, each re-recordable with a `HotkeyInput`, disabled, or reset to its default; with a search box and a switch for single-key shortcuts (WCAG 2.1.4).
-->
<!--
  HotkeyEditor — the registry's bindings as a table: one row per command,
  its name the row header and the label of its shortcut field. Changes go
  straight into the registry (`setBinding`, `reset`), which reports them
  through its `onOverridesChange` for the app to persist; `overrides` mirrors
  them for a caller that would rather bind. Needs a registry in context.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import SearchInput from '../fields/SearchInput.svelte';
  import Toggle from '../fields/Toggle.svelte';
  import { getHotkeyRegistry } from './context.svelte.ts';
  import HotkeyInput from './HotkeyInput.svelte';
  import type { HotkeyChord } from './types.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The viewer's bindings by action id (`null` disables one). Bindable; mirrors the registry's. */
    overrides?: Readonly<Record<string, HotkeyChord | null>> | undefined;
    /**
     * Show a box that filters commands by name.
     * @defaultValue `true`
     */
    searchable?: boolean | undefined;
    /**
     * Offer the switch that turns all single-key shortcuts off.
     * @defaultValue `true`
     */
    singleKeyToggle?: boolean | undefined;
    /**
     * Require a modifier for new shortcuts.
     * @defaultValue `false`, since single-key shortcuts can be switched off here
     */
    requireModifier?: boolean | undefined;
    /**
     * The search box's label.
     * @defaultValue `'Search commands'`
     */
    searchLabel?: string | undefined;
    /**
     * The command column's heading.
     * @defaultValue `'Command'`
     */
    commandLabel?: string | undefined;
    /**
     * The shortcut column's heading.
     * @defaultValue `'Shortcut'`
     */
    shortcutLabel?: string | undefined;
    /**
     * The actions column's heading.
     * @defaultValue `'Actions'`
     */
    actionsLabel?: string | undefined;
    /**
     * A row's reset button.
     * @defaultValue `'Reset'`
     */
    resetLabel?: string | undefined;
    /**
     * A row's disable button.
     * @defaultValue `'Disable'`
     */
    disableLabel?: string | undefined;
    /**
     * The single-key switch.
     * @defaultValue `'Single-key shortcuts'`
     */
    singleKeyLabel?: string | undefined;
    /**
     * The single-key switch's description.
     * @defaultValue `'Shortcuts without Ctrl, ⌘ or Alt, like G then P. Turn off if you use speech input.'`
     */
    singleKeyDescription?: string | undefined;
    /**
     * Shown when the search matches nothing.
     * @defaultValue `'No commands match'`
     */
    noMatchesLabel?: string | undefined;
  }

  let {
    overrides = $bindable(),
    searchable = true,
    singleKeyToggle = true,
    requireModifier = false,
    searchLabel = 'Search commands',
    commandLabel = 'Command',
    shortcutLabel = 'Shortcut',
    actionsLabel = 'Actions',
    resetLabel = 'Reset',
    disableLabel = 'Disable',
    singleKeyLabel = 'Single-key shortcuts',
    singleKeyDescription = 'Shortcuts without Ctrl, ⌘ or Alt, like G then P. Turn off if you use speech input.',
    noMatchesLabel = 'No commands match',
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const registry = getHotkeyRegistry();
  const rowId = (index: number): string => `${uid}-command-${index}`;

  let query = $state('');

  // A caller's overrides load into the registry once; after that the registry leads.
  if (overrides !== undefined) registry.overrides = overrides;
  $effect(() => {
    overrides = registry.overrides;
  });

  const rows = $derived(
    registry.bindings.filter((binding) =>
      binding.label.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  );

  const change = (id: string, next: HotkeyChord | undefined): void => {
    registry.setBinding(id, next ?? null);
  };
</script>

<div {...rest} class={['flex flex-col gap-4', className]}>
  {#if searchable || singleKeyToggle}
    <div class="flex flex-wrap items-end justify-between gap-4">
      {#if searchable}
        <SearchInput label={searchLabel} bind:value={query} class="max-w-xs" />
      {/if}
      {#if singleKeyToggle}
        <Toggle
          label={singleKeyLabel}
          description={singleKeyDescription}
          bind:checked={registry.singleKeyEnabled}
        />
      {/if}
    </div>
  {/if}
  <table class="table">
    <thead>
      <tr>
        <th scope="col">{commandLabel}</th>
        <th scope="col">{shortcutLabel}</th>
        <th scope="col"><span class="sr-only">{actionsLabel}</span></th>
      </tr>
    </thead>
    <tbody>
      {#each rows as binding, index (binding.id)}
        <tr>
          <th scope="row" id={rowId(index)} class="font-normal">{binding.label}</th>
          <td>
            <HotkeyInput
              aria-labelledby={rowId(index)}
              value={binding.trigger}
              forId={binding.id}
              {requireModifier}
              onchange={(next) => change(binding.id, next)}
              size="sm"
            />
          </td>
          <td>
            <div class="flex justify-end gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                aria-describedby={rowId(index)}
                disabled={binding.trigger === undefined}
                onclick={() => registry.setBinding(binding.id, null)}
              >
                {disableLabel}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                aria-describedby={rowId(index)}
                disabled={!binding.overridden}
                onclick={() => registry.reset(binding.id)}
              >
                {resetLabel}
              </button>
            </div>
          </td>
        </tr>
      {:else}
        <tr><td colspan="3" class="text-base-content/60">{noMatchesLabel}</td></tr>
      {/each}
    </tbody>
  </table>
</div>
