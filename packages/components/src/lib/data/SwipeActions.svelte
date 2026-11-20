<!-- @component
A list row that reveals actions when swiped sideways, with a "More actions" menu holding every action so nothing depends on the gesture.
-->
<!--
  The gesture is hand-rolled (no bits-ui primitive): touch and pen only,
  locked to horizontal after 10 px so vertical scrolling is never blocked.
  Revealed buttons are `inert` until their side is open. The menu is the
  primary accessible path, visually hidden on touch but focusable.
-->
<script lang="ts">
  import { Ellipsis } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { MediaQuery } from 'svelte/reactivity';
  import Button from '../ui/Button.svelte';
  import DropdownMenu from '../ui/DropdownMenu.svelte';
  import MenuItem from '../ui/MenuItem.svelte';
  import type { Tone } from '../ui/tones.ts';
  import { getSwipeGroup, swipeActionTone, type SwipeAction } from './swipe-actions.svelte.ts';

  type Side = 'leading' | 'trailing';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The row's content. */
    children: Snippet<[]>;
    /** Revealed by swiping toward the end, from the start edge. */
    leading?: readonly SwipeAction[] | undefined;
    /** Revealed by swiping toward the start, from the end edge. */
    trailing?: readonly SwipeAction[] | undefined;
    /**
     * A long swipe (past 60% of the row) runs the first action of that side.
     * @defaultValue `false`
     */
    fullSwipe?: boolean | undefined;
    /**
     * Show the "More actions" button. `'auto'` shows it for a fine pointer and
     * keeps it visually hidden but focusable on touch.
     * @defaultValue `'auto'`
     */
    menuButton?: boolean | 'auto' | undefined;
    /**
     * The menu button's accessible name, from `rowLabel`.
     * @defaultValue `(row) => row === undefined ? 'More actions' : \`More actions for ${row}\``
     */
    menuLabel?: ((rowLabel: string | undefined) => string) | undefined;
    /** The row's name, for the menu button ("More actions for Bed 4"). */
    rowLabel?: string | undefined;
    /** Ignore the gesture and disable the menu button. */
    disabled?: boolean | undefined;
  }

  let {
    children,
    leading = [],
    trailing = [],
    fullSwipe = false,
    menuButton = 'auto',
    menuLabel = (row) => (row === undefined ? 'More actions' : `More actions for ${row}`),
    rowLabel,
    disabled = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const group = getSwipeGroup();
  const finePointer = new MediaQuery('pointer: fine', true);
  const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);
  const menuVisible = $derived(menuButton === 'auto' ? finePointer.current : menuButton);

  /** Movement, in CSS pixels, before a gesture commits to an axis. */
  const AXIS_LOCK = 10;
  /** The share of the row's width past which a full swipe runs. */
  const FULL_SWIPE = 0.6;

  let openSide: Side | undefined = $state();
  let dragOffset: number | undefined = $state();
  let rowWidth = $state(0);
  let leadingWidth = $state(0);
  let trailingWidth = $state(0);

  const offset = $derived.by(() => {
    if (dragOffset !== undefined) return dragOffset;
    if (openSide === 'leading') return leadingWidth;
    if (openSide === 'trailing') return -trailingWidth;
    return 0;
  });

  // Destructive actions go last in the menu, each side keeping its own order.
  const menuActions = $derived(
    [...leading, ...trailing].toSorted(
      (a, b) => Number(a.destructive ?? false) - Number(b.destructive ?? false),
    ),
  );

  const toneOf = (action: SwipeAction): Tone =>
    action.tone ?? (action.destructive === true ? 'error' : 'neutral');

  function setOpen(side: Side | undefined): void {
    openSide = side;
    if (group !== undefined && side !== undefined) group.open = uid;
  }

  // Another row of the group opening closes this one.
  $effect(() => {
    if (group !== undefined && group.open !== uid && openSide !== undefined) openSide = undefined;
  });

  function run(action: SwipeAction): void {
    setOpen(undefined);
    void action.onAction();
  }

  const sides = $derived({
    leading: { actions: leading, width: leadingWidth },
    trailing: { actions: trailing, width: trailingWidth },
  });

  /** The action a release at `dx` runs as a full swipe, if any. */
  function fullSwipeAction(side: Side, dx: number): SwipeAction | undefined {
    if (!fullSwipe || Math.abs(dx) < rowWidth * FULL_SWIPE) return undefined;
    return sides[side].actions[0];
  }

  /** Where a released swipe settles: a full-swipe action, a side, or closed. */
  function settle(dx: number): void {
    const side: Side = dx > 0 ? 'leading' : 'trailing';
    const action = fullSwipeAction(side, dx);
    if (action !== undefined) return run(action);
    const { actions, width } = sides[side];
    setOpen(actions.length > 0 && Math.abs(dx) > width / 2 ? side : undefined);
  }

  function clamp(dx: number): number {
    const max = leading.length === 0 ? 0 : fullSwipe ? rowWidth : leadingWidth;
    const min = trailing.length === 0 ? 0 : fullSwipe ? -rowWidth : -trailingWidth;
    return Math.min(max, Math.max(min, dx));
  }

  const swipe: Attachment<HTMLElement> = (node) => {
    let start: { id: number; x: number; y: number; base: number } | undefined;
    let axis: 'x' | 'y' | undefined;

    const down = (event: PointerEvent): void => {
      if (disabled || event.pointerType === 'mouse') return;
      start = { id: event.pointerId, x: event.clientX, y: event.clientY, base: offset };
      axis = undefined;
    };
    const move = (event: PointerEvent): void => {
      if (start?.id !== event.pointerId || axis === 'y') return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (axis === undefined) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') return;
      }
      dragOffset = clamp(start.base + dx);
    };
    const up = (event: PointerEvent): void => {
      if (start?.id !== event.pointerId) return;
      const dragged = dragOffset;
      start = undefined;
      dragOffset = undefined;
      if (axis === 'x' && dragged !== undefined) settle(dragged);
    };
    const cancel = (): void => {
      start = undefined;
      dragOffset = undefined;
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', cancel);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    };
  };

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && openSide !== undefined) {
      event.stopPropagation();
      setOpen(undefined);
    }
  }

  function onfocusout(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) {
      setOpen(undefined);
    }
  }
</script>

{#snippet panel(side: Side, actions: readonly SwipeAction[])}
  <div
    style:position="absolute"
    style:top="0"
    style:bottom="0"
    style:inset-inline-start={side === 'leading' ? '0' : undefined}
    style:inset-inline-end={side === 'trailing' ? '0' : undefined}
    style:display="flex"
    inert={openSide !== side}
    bind:clientWidth={null, (width) => (side === 'leading' ? (leadingWidth = width ?? 0) : (trailingWidth = width ?? 0))}
  >
    {#each actions as action (action.label)}
      <button
        type="button"
        class={['flex min-w-20 flex-col items-center justify-center gap-1 px-3 text-xs', swipeActionTone[toneOf(action)]]}
        onclick={() => run(action)}
      >
        {#if action.icon}<span aria-hidden="true">{@render action.icon()}</span>{/if}
        {action.label}
      </button>
    {/each}
  </div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  {...rest}
  class={className}
  style:position="relative"
  style:overflow="hidden"
  style:touch-action="pan-y"
  bind:clientWidth={rowWidth}
  {onkeydown}
  {onfocusout}
  {@attach swipe}
>
  {#if leading.length > 0}{@render panel('leading', leading)}{/if}
  {#if trailing.length > 0}{@render panel('trailing', trailing)}{/if}
  <div
    class="bg-base-100 flex items-center gap-2"
    style:position="relative"
    style:transform="translateX({offset}px)"
    style:transition={dragOffset !== undefined || reducedMotion.current ? 'none' : 'transform 150ms ease-out'}
  >
    <div class="min-w-0 flex-1">{@render children()}</div>
    {#if menuActions.length > 0}
      <DropdownMenu label={menuLabel(rowLabel)}>
        {#snippet trigger({ props })}
          <Button
            {...props}
            variant="ghost"
            size="sm"
            {disabled}
            aria-label={menuLabel(rowLabel)}
            class={['me-2', !menuVisible && 'sr-only focus-visible:not-sr-only']}
          >
            <Ellipsis class="size-4" aria-hidden="true" />
          </Button>
        {/snippet}
        {#each menuActions as action (action.label)}
          <MenuItem
            onSelect={() => run(action)}
            icon={action.icon}
            tone={action.destructive === true ? 'error' : undefined}
          >
            {action.label}
          </MenuItem>
        {/each}
      </DropdownMenu>
    {/if}
  </div>
</div>
