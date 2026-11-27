<!-- @component
Internal: an overflowing `Toolbar`'s row, inside bits-ui `Toolbar.Root`.
-->
<!--
  The row is `Overflow`'s, carrying the root's `role="toolbar"` props. The
  "More" trigger is a bits-ui `Toolbar.Button` wrapping the `DropdownMenu`
  trigger, so it is the last roving stop; it keeps the menu's `id`, which the
  menu is labelled by. Which control holds the Tab stop is this component's
  (`toolbar-stop.ts`).
-->
<script lang="ts" generics="T extends OverflowEntry">
  import { Toolbar } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import Overflow, {
    type OverflowEntry,
    type OverflowItemAttributes,
    type OverflowTrigger,
  } from './Overflow.svelte';
  import { MORE_STOP, resolveStop, setToolbarStop, type StopKey } from './toolbar-stop.ts';

  interface Props {
    /** bits-ui `Toolbar.Root`'s props, with the caller's attributes. */
    root: Record<string, unknown>;
    label: string;
    items: readonly T[];
    item: Snippet<[T, number, OverflowItemAttributes]>;
    moreLabel: string;
    class: ClassValue;
  }

  let { root, label, items, item, moreLabel, class: className }: Props = $props();

  let wanted: StopKey | undefined = $state();
  let hidden: ReadonlySet<string> = $state(new Set());
  const current = $derived(resolveStop(wanted, items, hidden));

  setToolbarStop({ tabIndex: (key) => (key === current ? 0 : -1) });

  function onHiddenChange(entries: readonly T[]): void {
    hidden = new Set(entries.map((entry) => entry.id));
  }

  function onfocusin(event: FocusEvent): void {
    const callerHandler = root['onfocusin'];
    if (typeof callerHandler === 'function') callerHandler(event);
    const control =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-overflow-id], [data-overflow-more]')
        : null;
    if (control !== null) wanted = control.dataset['overflowId'] ?? MORE_STOP;
  }
</script>

{#snippet trigger({ props, text }: OverflowTrigger)}
  <Toolbar.Button {...props}>
    {#snippet child({ props: merged })}
      <button {...merged} tabindex={current === MORE_STOP ? 0 : -1}>{text}</button>
    {/snippet}
  </Toolbar.Button>
{/snippet}

<Overflow
  {...root}
  aria-label={label}
  aria-orientation="horizontal"
  {items}
  {item}
  {moreLabel}
  {trigger}
  {onHiddenChange}
  {onfocusin}
  class={className}
/>
