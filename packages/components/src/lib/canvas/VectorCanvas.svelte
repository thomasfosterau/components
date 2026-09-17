<!--
  VectorCanvas — a pan-and-zoom SVG surface over a {@link VectorDocument}, with
  the elements drawn by a renderer the application supplies.

  It owns the viewport and the pointer plumbing; it owns nothing about what the
  elements MEAN. Selection, creation and dragging are the application's, reached
  through `oninteract` — which is why a floor-plan editor and a planting plan
  can share this without either one's vocabulary leaking into it.

  ## ARIA contract

  The `<svg>` is `role="application"` named by `label` (default "Vector editing
  canvas"). `application` is the honest role for a surface whose whole input
  vocabulary is pointer gestures the page interprets — it tells a screen reader
  to pass keys through rather than to read the SVG as a picture. It is also a
  promise this component alone cannot keep: an application that makes a canvas
  its only way to do something owes the reader a second, non-pointer path to the
  same edit, and that path is the page's, not this component's.

  ## Two decisions worth stating

  - The document prop is `doc`, not `document`: a prop called `document` shadows
    the global inside a component that also reaches for the DOM, which is a bug
    waiting for the next line of code.
  - The viewport is REPORTED through `onviewportchange` rather than mutated
    through `$bindable`, so the document stays the caller's to own and an undo
    stack has something to undo.

  Pointer events rather than mouse events: one code path covers mouse, touch and
  pen, and `setPointerCapture` keeps a drag alive past the edge of the canvas.

  Hand-rolled rather than built on a bits-ui primitive because there is no
  primitive for this: bits-ui owns focus, keyboard and ARIA relationships
  between named widgets, and a pan/zoom surface is none of those — it is raw
  pointer geometry.
-->
<script lang="ts" generics="T extends CanvasElement">
  import type { Snippet } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';
  import type { CanvasElement, Point, VectorDocument, Viewport } from './types.ts';
  import { panBy, screenToCanvas, snapToGrid, sortByZIndex, zoomAbout } from './utils.ts';

  interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'width' | 'height' | 'class'> {
    doc: VectorDocument<T>;
    /** Which elements the application considers selected. */
    selected?: ReadonlySet<string>;
    /** The application's active tool; `pan` is the one this component handles. */
    tool?: string;
    /** Viewport size in CSS pixels. */
    width?: number;
    height?: number;
    /** Draws one element, told whether it is selected. */
    element?: Snippet<[T, boolean]>;
    /** Whether pointer input is accepted at all. */
    interactive?: boolean;
    /** Names the surface for assistive tech. */
    label?: string;
    /**
     * The viewport after a pan or a zoom.
     *
     * `| undefined` on every callback here and below is the `$props()` seam
     * under `exactOptionalPropertyTypes`: a caller holding an optional handler
     * spreads it straight through, and `{...maybe}` hands over an explicit
     * `undefined` that a bare `?:` would refuse.
     */
    onviewportchange?: ((viewport: Viewport) => void) | undefined;
    /** A pointer gesture, in canvas coordinates, snapped when the grid says so. */
    oninteract?:
      | ((event: {
          readonly phase: 'down' | 'move' | 'up';
          readonly tool: string;
          readonly point: Point;
          /**
           * How many presses this one is in a run of rapid presses at the same
           * spot: 1 for a single press, 2 for the second of a double-press.
           * Always 1 on `move` and `up`.
           */
          readonly detail: number;
          readonly native: PointerEvent;
        }) => void)
      | undefined;
    /** Merged onto the sized box that clips the surface, caller's last. */
    class?: string | undefined;
  }

  let {
    doc,
    selected = new Set<string>(),
    tool = 'select',
    width = 800,
    height = 600,
    element,
    interactive = true,
    label = 'Vector editing canvas',
    onviewportchange,
    oninteract,
    class: className,
    ...rest
  }: Props = $props();

  // Scoped to this instance: two canvases on one page would otherwise share a
  // `<pattern id>`, and the second would paint the first's grid.
  const uid = $props.id();
  const gridPatternId = `vector-canvas-grid-${uid}`;

  let surface = $state<SVGSVGElement>();
  /** -1 is "no pointer down"; the id is what `setPointerCapture` released. */
  let dragging = $state(-1);
  let panning = $state(false);
  /**
   * The pointer's last SCREEN position, so a pan is the difference between two
   * positions we recorded. `MouseEvent.movementX` would say the same thing in
   * one property, but its value is scaled by the device pixel ratio in some
   * browsers and zeroed after a coalesced move in others — a pan that drifts
   * on one machine and not another is not worth the line it saves.
   */
  let lastScreen = $state<Point>({ x: 0, y: 0 });

  /**
   * Chromium's own double-click interval and its slop, in milliseconds and CSS
   * pixels.
   */
  const MULTI_PRESS_MS = 500;
  const MULTI_PRESS_SLOP = 4;
  /** The run of rapid presses at one spot: 1, then 2, then 3… */
  let pressCount = 0;
  let lastPress = { time: 0, x: 0, y: 0 };

  /**
   * The press count, counted HERE rather than read off `event.detail`.
   *
   * `MouseEvent.detail` carries the click count; `PointerEvent.detail` is 0,
   * always, in every browser — and a component that listens on pointer events
   * to cover mouse, touch and pen alike therefore never sees it. That is easy
   * to miss, because a synthetic `pointerdown` dispatched by a test carries
   * whatever `detail` the test puts on it: the check reads as working and does
   * nothing at all in a browser. Counting it here also makes a double-TAP
   * count, which `detail` would not have done on any input.
   */
  const countPress = (event: PointerEvent): number => {
    const rapid =
      event.timeStamp - lastPress.time < MULTI_PRESS_MS &&
      Math.abs(event.clientX - lastPress.x) <= MULTI_PRESS_SLOP &&
      Math.abs(event.clientY - lastPress.y) <= MULTI_PRESS_SLOP;
    pressCount = rapid ? pressCount + 1 : 1;
    lastPress = { time: event.timeStamp, x: event.clientX, y: event.clientY };
    return pressCount;
  };

  const ordered = $derived(sortByZIndex(doc.elements));

  const at = (event: PointerEvent): Point => {
    if (surface === undefined) return { x: 0, y: 0 };
    const box = surface.getBoundingClientRect();
    const point = screenToCanvas(
      { x: event.clientX - box.left, y: event.clientY - box.top },
      doc.viewport,
    );
    return doc.grid.snap ? snapToGrid(point, doc.grid.size) : point;
  };

  const down = (event: PointerEvent): void => {
    if (!interactive) return;
    // Capture on the surface so a drag that leaves the element keeps reporting.
    // Guarded rather than called bare: a test DOM (and an old browser) can
    // have the element without the method, and a TypeError here would take
    // the whole gesture with it.
    if (typeof surface?.setPointerCapture === 'function') surface.setPointerCapture(event.pointerId);
    dragging = event.pointerId;
    panning = tool === 'pan';
    lastScreen = { x: event.clientX, y: event.clientY };
    const detail = countPress(event);
    if (!panning) oninteract?.({ phase: 'down', tool, point: at(event), detail, native: event });
  };

  const move = (event: PointerEvent): void => {
    if (!interactive || dragging !== event.pointerId) return;
    if (panning) {
      onviewportchange?.(
        panBy(doc.viewport, event.clientX - lastScreen.x, event.clientY - lastScreen.y),
      );
      lastScreen = { x: event.clientX, y: event.clientY };
    } else oninteract?.({ phase: 'move', tool, point: at(event), detail: 1, native: event });
  };

  const up = (event: PointerEvent): void => {
    if (!interactive || dragging !== event.pointerId) return;
    if (typeof surface?.releasePointerCapture === 'function') {
      surface.releasePointerCapture(event.pointerId);
    }
    if (!panning) oninteract?.({ phase: 'up', tool, point: at(event), detail: 1, native: event });
    dragging = -1;
    panning = false;
  };

  const wheel = (event: WheelEvent): void => {
    if (!interactive || surface === undefined) return;
    event.preventDefault();
    const box = surface.getBoundingClientRect();
    const pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    onviewportchange?.(zoomAbout(doc.viewport, pointer, event.deltaY > 0 ? 0.9 : 1.1));
  };
</script>

<div
  class={['bg-base-100 relative overflow-hidden select-none', className]}
  style:width="{width}px"
  style:height="{height}px"
  style:touch-action="none"
>
  <svg
    {...rest}
    bind:this={surface}
    {width}
    {height}
    role="application"
    aria-label={label}
    class="cursor-crosshair"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onwheel={wheel}
  >
    <defs>
      <pattern
        id={gridPatternId}
        width={doc.grid.size}
        height={doc.grid.size}
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M {doc.grid.size} 0 L 0 0 0 {doc.grid.size}"
          fill="none"
          stroke={doc.grid.color}
          stroke-width="0.5"
        />
      </pattern>
    </defs>

    <g
      transform="translate({doc.viewport.offsetX},{doc.viewport.offsetY}) scale({doc.viewport.zoom})"
    >
      {#if doc.grid.visible}
        <!-- Sized to swamp any reachable pan rather than tracked to the
             viewport: a rect that has to be recomputed on every pan is a
             reactive dependency for a decoration. -->
        <rect x={-10000} y={-10000} width={20000} height={20000} fill="url(#{gridPatternId})" />
      {/if}

      {#each ordered as node (node.id)}
        <g opacity={node.visible === false ? 0 : node.opacity}>
          {#if element}
            {@render element(node, selected.has(node.id))}
          {:else}
            <!-- The fallback is a marker, not a drawing: an application that
                 has not supplied a renderer should SEE that it has not. -->
            <circle
              cx={node.position.x}
              cy={node.position.y}
              r="5"
              fill={node.fillColor}
              stroke={selected.has(node.id) ? 'currentColor' : node.strokeColor}
              stroke-width={node.strokeWidth}
            />
          {/if}
        </g>
      {/each}
    </g>
  </svg>
</div>
