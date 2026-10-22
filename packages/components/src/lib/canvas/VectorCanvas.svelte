<!-- @component
A pan-and-zoom SVG surface over a `VectorDocument`, with each element drawn by a renderer snippet the application supplies.
-->
<!--
  VectorCanvas — a pan-and-zoom SVG surface over a {@link VectorDocument}, with
  the elements drawn by a renderer the application supplies.

  It owns the viewport and the pointer plumbing; it owns nothing about what the
  elements MEAN. Selection, creation and dragging are the application's, reached
  through `oninteract` — which is why a floor-plan editor and a planting plan
  can share this without either one's vocabulary leaking into it.

  ## ARIA contract

  The `<svg>` is `role="application"` named by `label` (default "Vector editing
  canvas"). `application` is the honest role for a surface that interprets its
  own input — it tells a screen reader to pass keys through rather than to read
  the SVG as a picture — and it is a promise that the surface HANDLES those
  keys, which § Keys keeps.

  ## Keys

  When `interactive`, the `<svg>` is one Tab stop, and every keydown and keyup
  on it goes to `onkey` FIRST. What a key means to the elements is the
  application's, for the same reason a pointer gesture is. Only a key the
  application left alone (did not `preventDefault`), and not a Ctrl, Alt or
  Meta chord, falls through to the two bindings this component owns, because
  it owns the viewport:

  | Key                     | Does                                         |
  | ----------------------- | -------------------------------------------- |
  | Arrow keys (`pan` tool) | pan by 40 screen pixels; Shift for 160       |
  | `+` / `=`, `-`          | zoom in / out about the centre of the view   |

  The application says which of its elements is focused through
  `activedescendant` (an element id inside the surface), so DOM focus stays on
  the `<svg>` and the arrow keys never scroll the page out from under the
  reader.

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

  // The key and focus handlers are the surface's own; `onkey` and
  // `onfocuschange` are how a caller hears them.
  interface Props
    extends Omit<
      SVGAttributes<SVGSVGElement>,
      'width' | 'height' | 'class' | 'onkeydown' | 'onkeyup' | 'onfocus' | 'onblur'
    > {
    /** The document to draw: its elements, viewport and grid. */
    doc: VectorDocument<T>;
    /**
     * Which elements the application considers selected.
     * @defaultValue an empty set
     */
    selected?: ReadonlySet<string> | undefined;
    /**
     * The application's active tool; `pan` is the one this component handles.
     * @defaultValue `'select'`
     */
    tool?: string | undefined;
    /**
     * Viewport size in CSS pixels.
     * @defaultValue `800`
     */
    width?: number | undefined;
    /**
     * Viewport height in CSS pixels.
     * @defaultValue `600`
     */
    height?: number | undefined;
    /** Draws one element, told whether it is selected. */
    element?: Snippet<[T, boolean]> | undefined;
    /**
     * Whether pointer input is accepted at all.
     * @defaultValue `true`
     */
    interactive?: boolean | undefined;
    /**
     * Names the surface for assistive tech.
     * @defaultValue `'Vector editing canvas'`
     */
    label?: string | undefined;
    /**
     * The id of the element that has keyboard focus inside the surface, for
     * `aria-activedescendant`; `''` for none.
     * @defaultValue `''`
     */
    activedescendant?: string | undefined;
    /**
     * The id of an element describing the surface's keys, for
     * `aria-describedby`; `''` for none.
     * @defaultValue `''`
     */
    describedby?: string | undefined;
    /** Drawn above every element, in canvas coordinates: a cursor, a guide. */
    overlay?: Snippet<[]> | undefined;
    /** Every keydown and keyup on the surface, before its own keys; `preventDefault` claims the key. */
    onkey?: ((event: KeyboardEvent) => void) | undefined;
    /** Whether the surface has keyboard focus, each time that changes. */
    onfocuschange?: ((focused: boolean) => void) | undefined;
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
    activedescendant = '',
    describedby = '',
    overlay,
    onkey,
    onfocuschange,
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

  /** Screen pixels one arrow press pans by with the `pan` tool; Shift multiplies it. */
  const PAN_STEP = 40;
  const COARSE_PAN = 4;

  /** Which way the view moves for each arrow: right reveals more of the right. */
  const PAN_DIRECTIONS = new Map<string, Point>([
    ['ArrowLeft', { x: 1, y: 0 }],
    ['ArrowRight', { x: -1, y: 0 }],
    ['ArrowUp', { x: 0, y: 1 }],
    ['ArrowDown', { x: 0, y: -1 }],
  ]);

  /** The zoom factor per key; `=` is `+` without the Shift. */
  const ZOOM_KEYS = new Map<string, number>([
    ['+', 1.1],
    ['=', 1.1],
    ['-', 0.9],
  ]);

  /** The view's own keys, for whatever the application did not claim. */
  const viewKey = (event: KeyboardEvent): boolean => {
    const factor = ZOOM_KEYS.get(event.key);
    if (factor !== undefined) {
      onviewportchange?.(zoomAbout(doc.viewport, { x: width / 2, y: height / 2 }, factor));
      return true;
    }
    const direction = PAN_DIRECTIONS.get(event.key);
    if (tool !== 'pan' || direction === undefined) return false;
    const step = PAN_STEP * (event.shiftKey ? COARSE_PAN : 1);
    onviewportchange?.(panBy(doc.viewport, direction.x * step, direction.y * step));
    return true;
  };

  const key = (event: KeyboardEvent): void => {
    if (!interactive) return;
    onkey?.(event);
    if (event.type !== 'keydown' || event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (viewKey(event)) event.preventDefault();
  };
</script>

<div
  class={['bg-base-100 relative overflow-hidden select-none', className]}
  style:width="{width}px"
  style:height="{height}px"
  style:touch-action="none"
>
  <!-- Svelte's a11y table files `application` under the non-interactive roles;
       ARIA defines it as the role that takes focus and handles its own keys,
       which is exactly what the tabindex and the key handlers are for. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <svg
    {...rest}
    bind:this={surface}
    {width}
    {height}
    role="application"
    aria-label={label}
    aria-activedescendant={activedescendant === '' ? undefined : activedescendant}
    aria-describedby={describedby === '' ? undefined : describedby}
    tabindex={interactive ? 0 : undefined}
    class="focus-visible:outline-primary cursor-crosshair focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
    onkeydown={key}
    onkeyup={key}
    onfocus={() => onfocuschange?.(true)}
    onblur={() => onfocuschange?.(false)}
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

      {@render overlay?.()}
    </g>
  </svg>
</div>
