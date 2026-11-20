<!-- @component
The frame for drill-down screens (`StackPage`s): reports nothing itself, but adds the touch edge-swipe back gesture. Create the stack with `createNavigationStack()` and report each navigation to it from the router.
-->
<!--
  NavigationStack — the gesture half. A touch that starts within 24 px of the
  leading edge and travels sideways goes back, by clicking the current page's
  Back link, so the router does the navigating. It only ever adds to the link,
  never replaces it, and mirrors in right-to-left layouts. The slide itself
  is CSS in `theme.css`, keyed on `data-stack-direction`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getNavigationStack } from './stack-direction.svelte.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The current screen. */
    children: Snippet<[]>;
    /**
     * Swipe from the leading edge to go back, on touch.
     * @defaultValue `true`
     */
    swipeBack?: boolean | undefined;
  }

  let { children, swipeBack = true, class: className, ...rest }: Props = $props();

  const stack = getNavigationStack();
  const EDGE = 24;
  const DISTANCE = 80;

  let frame: HTMLDivElement | undefined = $state();
  let swipe: { pointerId: number; x: number; y: number; sign: 1 | -1 } | undefined;

  const onPointerDown = (event: PointerEvent): void => {
    if (!swipeBack || event.pointerType !== 'touch' || !frame) return;
    const bounds = frame.getBoundingClientRect();
    const rtl = getComputedStyle(frame).direction === 'rtl';
    const fromEdge = rtl ? bounds.right - event.clientX : event.clientX - bounds.left;
    if (fromEdge <= EDGE) {
      swipe = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, sign: rtl ? -1 : 1 };
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (swipe?.pointerId !== event.pointerId) return;
    const travelled = (event.clientX - swipe.x) * swipe.sign;
    if (Math.abs(event.clientY - swipe.y) > travelled && travelled > EDGE) {
      swipe = undefined;
    } else if (travelled >= DISTANCE) {
      swipe = undefined;
      stack?.back();
    }
  };

  const onPointerEnd = (): void => {
    swipe = undefined;
  };
</script>

<div
  {...rest}
  bind:this={frame}
  class={className}
  style:touch-action={swipeBack ? 'pan-y' : undefined}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerEnd}
  onpointercancel={onPointerEnd}
>
  {@render children()}
</div>
