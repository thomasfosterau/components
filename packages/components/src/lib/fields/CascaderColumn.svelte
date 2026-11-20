<!-- @component
One column of a `Cascader`: a listbox of one level's nodes, with `aria-activedescendant` focus, ↑/↓, Home/End and typeahead. Internal.
-->
<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import Spinner from '../ui/Spinner.svelte';
  import { isBranch, type CascaderNode } from './cascader.ts';
  import { createTypeahead } from './typeahead.ts';

  interface Props {
    id: string;
    /** The column's accessible name: its parent's label, or the field's for the first. */
    label: string;
    /** Names the column by an element instead (the field's label, for the first). */
    labelledBy: string | undefined;
    nodes: readonly CascaderNode[];
    /** The value on the browsed path at this depth. */
    selected: string | undefined;
    /** The index of the active option. Bindable. */
    active: number;
    /** This column's own nodes are loading. */
    busy: boolean;
    loadingLabel: string;
    emptyLabel: string;
    /** The id of the "has subcategories" hint read on branches. */
    branchHintId: string;
    /** Shown below `sm`, where one column shows at a time. */
    current: boolean;
    /** Open a branch or choose a leaf. */
    onOpen: (index: number) => void;
    /** Return to the previous column (←). */
    onBack: () => void;
  }

  let {
    id,
    label,
    labelledBy,
    nodes,
    selected,
    active = $bindable(),
    busy,
    loadingLabel,
    emptyLabel,
    branchHintId,
    current,
    onOpen,
    onBack,
  }: Props = $props();

  const optionId = (index: number): string => `${id}-option-${index}`;
  const enabled = (index: number): boolean => nodes[index]?.disabled !== true;

  const nextEnabled = (start: number, step: 1 | -1): number => {
    for (let index = start; index >= 0 && index < nodes.length; index += step) {
      if (enabled(index)) return index;
    }
    return active;
  };

  const moveTo = (index: number): void => {
    if (index < 0 || index >= nodes.length) return;
    active = index;
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
  };

  const typeAhead = createTypeahead();

  /** Keys that move within the column, by the index they move to. */
  const moves: Record<string, () => number> = {
    ArrowDown: () => nextEnabled(active + 1, 1),
    ArrowUp: () => nextEnabled(Math.max(active - 1, 0), -1),
    Home: () => nextEnabled(0, 1),
    End: () => nextEnabled(nodes.length - 1, -1),
  };

  const open = (): void => {
    if (active >= 0 && enabled(active)) onOpen(active);
  };

  /** The action for a key, given whether the column reads right to left. */
  const action = (key: string, rtl: boolean): (() => void) | undefined => {
    const move = moves[key];
    if (move !== undefined) return () => moveTo(move());
    if (key === 'Enter' || key === (rtl ? 'ArrowLeft' : 'ArrowRight')) return open;
    if (key === (rtl ? 'ArrowRight' : 'ArrowLeft')) return onBack;
    return undefined;
  };

  const onkeydown = (event: KeyboardEvent & { currentTarget: HTMLElement }): void => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const run = action(event.key, rtl);
    const typed = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (run === undefined && !typed) return;
    event.preventDefault();
    if (run !== undefined) {
      run();
      return;
    }
    const index = typeAhead(
      event.key,
      nodes.map((node) => node.label),
      enabled,
      active,
    );
    if (index !== undefined) moveTo(index);
  };

  const pick = (index: number): void => {
    if (!enabled(index)) return;
    active = index;
    onOpen(index);
  };

  const rows = $derived(
    nodes.map((node, index) => ({
      node,
      index,
      chosen: node.value === selected,
      disabled: node.disabled === true,
      describedBy: isBranch(node) ? branchHintId : undefined,
      branch: isBranch(node),
    })),
  );

  /** What the column says instead of, or before, its options. */
  const status = $derived(busy ? loadingLabel : nodes.length === 0 ? emptyLabel : undefined);
</script>

<div
  {id}
  role="listbox"
  tabindex="0"
  aria-label={labelledBy === undefined ? label : undefined}
  aria-labelledby={labelledBy}
  aria-busy={busy ? 'true' : undefined}
  aria-activedescendant={active >= 0 && active < nodes.length ? optionId(active) : undefined}
  class={[
    'border-base-300 focus-visible:outline-primary max-h-72 w-full shrink-0 overflow-y-auto py-1 focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-48 sm:border-e sm:last:border-e-0',
    current ? 'block' : 'hidden sm:block',
  ]}
  {onkeydown}
>
  {#if status !== undefined}
    <div role="none" class="text-base-content/60 flex items-center gap-2 px-3 py-2">
      <Spinner decorative size="xs" class={busy ? undefined : 'hidden'} />
      <span>{status}</span>
    </div>
  {/if}
  {#each rows as row (row.node.value)}
    <!-- Focus stays on the listbox (aria-activedescendant), which handles the
         keys, so an option is neither focusable nor keyboard-activated itself. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
    <div
      id={optionId(row.index)}
      role="option"
      aria-selected={row.chosen}
      aria-disabled={row.disabled ? 'true' : undefined}
      aria-describedby={row.describedBy}
      class={[
        'flex cursor-default items-center gap-2 px-3 py-2',
        row.index === active && 'bg-base-200',
        row.chosen && 'bg-primary/15 font-medium',
        row.disabled && 'opacity-50',
      ]}
      onclick={() => {
        pick(row.index);
      }}
    >
      <span class="min-w-0 flex-1 truncate">{row.node.label}</span>
      <ChevronRight
        class={['size-4 shrink-0 rtl:rotate-180', !row.branch && 'invisible']}
        aria-hidden="true"
      />
    </div>
  {/each}
</div>
