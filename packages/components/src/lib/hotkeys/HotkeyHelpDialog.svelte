<!--
  HotkeyHelpDialog — the `?` overlay: every hotkey the current viewer can
  press right now, grouped into "This page" and "Everywhere", with
  platform-aware key chips.

  The list is read live from the registry rather than passed in, so it can
  never drift from what `HotkeyProvider` would actually match: role-gated
  actions are already absent, and a page's registrations disappear with the
  page. Opening and closing is the registry's `helpOpen`, which is what a
  registered action toggles.

  ARIA contract: it is this library's `Dialog`, so bits-ui owns the modal —
  `aria-modal`, the focus trap, Escape, the focus return — and `title` is the
  dialog's accessible name. Each section is a `<section>` with a heading, and
  each hotkey a list item pairing the action's label with its `HotkeyBadge`,
  so the reading order is "what it does, then what to press".
-->
<script lang="ts">
  import Dialog from '../feedback/Dialog.svelte';
  import { getHotkeyRegistry } from './context.svelte.ts';
  import HotkeyBadge from './HotkeyBadge.svelte';
  import type { RegisteredAction } from './types.ts';

  interface Props {
    /** The dialog's accessible name. */
    title?: string | undefined;
    /** Accessible name of the corner close button. */
    closeLabel?: string | undefined;
    /** Shown when nothing with a trigger is registered. */
    emptyLabel?: string | undefined;
    /** Section headings, in render order. */
    groupLabels?: { page: string; global: string } | undefined;
    /** What `$mod` reads as on Apple platforms. */
    commandLabel?: string | undefined;
    /** What `$mod` reads as everywhere else. */
    controlLabel?: string | undefined;
    /** Read between the keys of a sequence. */
    thenLabel?: string | undefined;
  }

  let {
    title = 'Keyboard shortcuts',
    closeLabel = 'Close',
    emptyLabel = 'No keyboard shortcuts are available on this page.',
    groupLabels = { page: 'This page', global: 'Everywhere' },
    commandLabel,
    controlLabel,
    thenLabel,
  }: Props = $props();

  const registry = getHotkeyRegistry();

  const sections = $derived(
    [
      {
        heading: groupLabels.page,
        entries: registry.hotkeys.filter((entry) => entry.scope === 'page'),
      },
      {
        heading: groupLabels.global,
        entries: registry.hotkeys.filter((entry) => entry.scope === 'global'),
      },
    ].filter((section) => section.entries.length > 0),
  );
</script>

{#snippet hotkeyRow(entry: RegisteredAction)}
  <li class="flex items-center justify-between gap-4 py-1.5">
    <span class="text-base-content text-sm">{entry.action.label}</span>
    {#if entry.action.trigger !== undefined}
      <HotkeyBadge trigger={entry.action.trigger} {commandLabel} {controlLabel} {thenLabel} />
    {/if}
  </li>
{/snippet}

<Dialog
  bind:open={() => registry.helpOpen, (open) => (registry.helpOpen = open)}
  {title}
  {closeLabel}
>
  {#if registry.hotkeys.length === 0}
    <p class="text-base-content/70 text-sm leading-6">{emptyLabel}</p>
  {:else}
    {#each sections as section (section.heading)}
      <section class="mt-4 first:mt-0">
        <h3 class="text-base-content/70 text-xs font-semibold tracking-wide uppercase">
          {section.heading}
        </h3>
        <ul class="divide-base-300 mt-2 divide-y">
          {#each section.entries as entry (entry.action.id)}
            {@render hotkeyRow(entry)}
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</Dialog>
