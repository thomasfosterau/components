<!-- @component
A tab strip that is either a tab widget over panels (`mode="panels"`) or navigation between sibling routes (`mode="links"`).
-->
<!--
  Tabs — one strip, two things.

  `mode="panels"` is a tab WIDGET: bits-ui's `Tabs`, which owns the
  `tablist`/`tab`/`tabpanel` roles, the roving tabindex (one Tab stop for the
  whole strip), Arrow/Home/End movement between tabs, and the
  `aria-controls`/`aria-labelledby` pairing between each tab and its panel.
  None of that is worth hand-rolling and all of it is easy to get subtly
  wrong.

  `mode="links"` is NAVIGATION between sibling routes that happens to look
  like tabs (First preferences / Two-candidate preferred / Polling places).
  It must NOT be a tab widget: these are separate documents, each with its own
  URL, and a `role="tab"` that navigates lies to a reader about what pressing
  it does. So it is a labelled `<nav>` of ordinary anchors, every one of them
  a Tab stop, with `aria-current="page"` on the one you are on — chosen by
  `value` when the caller tracks it, and otherwise by the components context's
  own current-page check.

  ARIA contract: panels mode is bits-ui's, unmodified — `aria-selected` on the
  tabs, `aria-controls` to the panel, arrows and Home/End moving selection.
  Links mode is `<nav aria-label>` + `aria-current="page"`. A disabled item in
  links mode is not a link at all (there is nothing to navigate to) but stays
  in the strip as `aria-disabled` text, so the set of sections a reader can
  see does not change as their permissions do.
-->
<script lang="ts">
  import { Tabs as BitsTabs } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { getComponentsContext } from '../context.svelte.ts';
  import type { Size } from '../ui/tones.ts';
  import { tabsSize, tabsVariant, type TabItem, type TabsMode, type TabsVariant } from './types.ts';

  interface Props {
    /** The tabs, in order. */
    items: readonly TabItem[];
    /**
     * `panels` for a tab widget; `links` for navigation between routes.
     * @defaultValue `'panels'`
     */
    mode?: TabsMode | undefined;
    /**
     * The selected value (panels) or the current one (links); `''` means
     * unset — panels then select the first enabled item and links fall back to
     * the context's current-page check. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * Accessible name of the tab list / the navigation landmark.
     * @defaultValue `'Sections'`
     */
    label?: string | undefined;
    /**
     * daisyUI tab style.
     * @defaultValue `'border'`
     */
    variant?: TabsVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /** One panel's content, in `panels` mode. Without it, no panels render. */
    panel?: Snippet<[TabItem]> | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
  }

  let {
    items,
    mode = 'panels',
    value = $bindable(''),
    label = 'Sections',
    variant = 'border',
    size = 'md',
    panel,
    class: className,
  }: Props = $props();

  const context = getComponentsContext();

  const stripClasses = $derived(['tabs', tabsVariant[variant], tabsSize[size]]);

  // A tab widget with nothing selected shows nothing, so panels need a
  // selection from the start; the first ENABLED item, since a disabled one
  // cannot be navigated back to.
  const selected = $derived(
    value !== '' ? value : (items.find((item) => item.disabled !== true)?.value ?? ''),
  );

  const isCurrentLink = (item: TabItem): boolean =>
    value !== ''
      ? value === item.value
      : item.href !== undefined && context.isCurrent(context.href(item.href));
</script>

{#if mode === 'links'}
  <nav aria-label={label} class={[...stripClasses, className]}>
    {#each items as item (item.value)}
      {#if item.disabled === true}
        <span class="tab tab-disabled" aria-disabled="true">{item.label}</span>
      {:else}
        {@const current = isCurrentLink(item)}
        <a
          href={context.href(item.href ?? '')}
          class={['tab', current && 'tab-active']}
          aria-current={current ? 'page' : undefined}
        >
          {item.label}
        </a>
      {/if}
    {/each}
  </nav>
{:else}
  <!-- A function binding rather than `bind:value`: the value this renders at
       is the DEFAULTED one, while what a write puts back is the caller's. -->
  <BitsTabs.Root bind:value={() => selected, (next) => (value = next)} class={className}>
    <BitsTabs.List class={stripClasses} aria-label={label}>
      {#each items as item (item.value)}
        <BitsTabs.Trigger
          value={item.value}
          disabled={item.disabled === true}
          class={['tab', selected === item.value && 'tab-active']}
        >
          {item.label}
        </BitsTabs.Trigger>
      {/each}
    </BitsTabs.List>
    {#if panel}
      {#each items as item (item.value)}
        <BitsTabs.Content value={item.value} class="py-4">{@render panel(item)}</BitsTabs.Content>
      {/each}
    {/if}
  </BitsTabs.Root>
{/if}
