<!-- @component
Draws one area, path or point of a plan, with grips or indicators when selected.
-->
<!--
  MapShapeView — how one area, path or point is drawn.

  Split out of `MapEditor`'s renderer snippet so the drawing is a component with
  its own props and its own story, and the editor is left holding only the
  decisions (what was clicked, where it moved to). The two were one nested
  snippet, which is the shape a component takes when it has not been given a
  name yet.

  ## Indicators and grips

  A vertex marker is a hollow ring when it cannot be dragged and a filled grip
  when it can: the rule is that the affordance MATCHES the capability, because a
  handle that looks draggable and is not is worse than no handle. A read-only
  consumer — a plan on a detail page — gets the honest rings; an editor that can
  actually move a vertex gets the grip that says so, plus the hollow, dashed
  midpoint handles a new vertex is dragged out of.

  Handles keep their pointer events (they are not `pointer-events: none`) for
  one reason: `VectorCanvas` listens on the `<svg>` itself, so a press on a grip
  reaches it by bubbling either way — and leaving them live is what lets
  `cursor: grab` be true under the pointer. Hit-testing is still geometric, in
  `shapes.ts`; nothing here decides what was picked.

  Handles are inside the viewport's `scale()`, so they shrink with the zoom —
  and so does `HANDLE_TOLERANCE`, which is in the same canvas units. The grip a
  reader sees and the grip they can grab are therefore the same size at every
  zoom, which is the property worth having.

  ## ARIA contract

  Only the focused part is named. This renders `<g>` inside a surface that is
  already `role="application"` and named by `VectorCanvas`'s `label`; naming
  every shape would put a hundred unreachable nodes into the accessibility tree
  of a widget a screen reader is told to pass keys through.

  `MapEditor` keeps keyboard focus on its surface and points
  `aria-activedescendant` at whichever part of a shape it means: the shape
  itself (`focus="shape"`) or one handle (`focus="vertex-2"`, `"midpoint-3"`,
  the same keys the handles are drawn under). That part, and only that part,
  carries `focusId`, `role="img"` and `focusLabel`, so assistive tech announces
  it; `focusVisible` draws a ring round a focused handle so a sighted keyboard
  user sees the same thing. The ring is one more entry in `handles`, and the
  naming attributes ride on each entry's `attributes`, so the markup still
  makes no decisions.
-->
<script lang="ts">
  import type { Point } from '@thomasfosterau/components/canvas';
  import type { MapShape } from './shapes.ts';
  import { edgeMidpoints, shapePath } from './shapes.ts';

  /** One drawn handle: where it sits, and what its look says it can do. */
  interface Handle {
    readonly key: string;
    readonly point: Point;
    readonly radius: number;
    readonly fill: string;
    readonly stroke: string;
    /** An SVG dash pattern, or `'none'` — the keyword, so the field is never absent. */
    readonly dash: string;
    readonly cursor: string;
    readonly strokeWidth: number;
    /** Extra attributes: the focused part's id and name, or the ring's `aria-hidden`. */
    readonly attributes: Readonly<Record<string, string>>;
  }

  interface Props {
    /** The shape to draw, in canvas coordinates. */
    shape: MapShape;
    /**
     * Draw the selection highlight and vertex markers.
     * @defaultValue `false`
     */
    selected?: boolean | undefined;
    /**
     * Whether this shape's vertices can be dragged; grips instead of indicators.
     * @defaultValue `false`
     */
    editable?: boolean | undefined;
    /**
     * The part with keyboard focus: `'shape'`, a handle's key (`'vertex-2'`,
     * `'midpoint-3'`), or `''` for none.
     * @defaultValue `''`
     */
    focus?: string | undefined;
    /**
     * The DOM id the focused part carries, for the surface's `aria-activedescendant`.
     * @defaultValue `''`
     */
    focusId?: string | undefined;
    /**
     * What assistive tech announces for the focused part.
     * @defaultValue `''`
     */
    focusLabel?: string | undefined;
    /**
     * Whether to ring a focused handle: while the surface itself has focus.
     * @defaultValue `false`
     */
    focusVisible?: boolean | undefined;
  }

  let {
    shape,
    selected = false,
    editable = false,
    focus = '',
    focusId = '',
    focusLabel = '',
    focusVisible = false,
  }: Props = $props();

  /** The attributes `aria-activedescendant` needs on whichever part is focused. */
  const named = $derived({ id: focusId, role: 'img', 'aria-label': focusLabel });
  const groupAttributes = $derived(focus === 'shape' && focusId !== '' ? named : {});

  const stroke = $derived(selected ? 'var(--color-primary)' : shape.strokeColor);
  const strokeWidth = $derived(selected ? shape.strokeWidth + 1 : shape.strokeWidth);
  // An open path is still filled by SVG, which closes it implicitly — so a line
  // with a fill would paint the ground between its ends.
  const fill = $derived(shape.type === 'line' ? 'none' : shape.fillColor);
  /**
   * Every handle to draw, decided here rather than in the markup.
   *
   * The template would otherwise branch per vertex and then again per midpoint,
   * which reads as two nested conditionals inside a loop; one list of what to
   * draw and one `{#each}` says the same thing and leaves the markup with no
   * decisions in it at all.
   */
  const handles = $derived.by((): readonly Handle[] => {
    if (!selected || shape.type === 'marker') return [];
    const vertices = (shape.points ?? []).map(
      (point, index): Handle => ({
        key: `vertex-${index}`,
        point,
        // Filled and larger when it can be dragged; a hollow ring when it is
        // only telling the reader where the corner is.
        radius: editable ? 3.5 : 2.5,
        fill: editable ? 'var(--color-primary)' : 'none',
        stroke: editable ? 'var(--color-base-100)' : 'var(--color-primary)',
        dash: 'none',
        cursor: editable ? 'cursor-grab' : '',
        strokeWidth: 1,
        attributes: {},
      }),
    );
    // Hollow, dashed and smaller than a grip: this is not a vertex yet.
    // Dragging one splits its edge and the new vertex comes away under the
    // pointer.
    const midpoints = edgeMidpoints(shape).map(
      (midpoint): Handle => ({
        key: `midpoint-${midpoint.index}`,
        point: midpoint.point,
        radius: 2.5,
        fill: 'var(--color-base-100)',
        stroke: 'var(--color-primary)',
        dash: '1 1',
        cursor: 'cursor-copy',
        strokeWidth: 1,
        attributes: {},
      }),
    );
    const drawn = editable ? vertices.concat(midpoints) : vertices;
    return drawn.flatMap((handle) => (handle.key === focus ? focused(handle) : [handle]));
  });

  /**
   * A focused handle: named for assistive tech, and — while the surface has
   * focus — ringed outside the grip in the text colour, so the ring reads
   * against the grip's fill and against the shape under it.
   */
  const focused = (handle: Handle): readonly Handle[] => {
    const labelled = focusId === '' ? handle : { ...handle, attributes: named };
    if (!focusVisible) return [labelled];
    const ring: Handle = {
      ...handle,
      key: 'focus-ring',
      radius: handle.radius + 2.5,
      fill: 'none',
      stroke: 'var(--color-base-content)',
      dash: 'none',
      cursor: '',
      strokeWidth: 1.5,
      attributes: { 'aria-hidden': 'true' },
    };
    return [ring, labelled];
  };
</script>

<g
  transform="translate({shape.position.x},{shape.position.y}) rotate({shape.rotation})"
  {...groupAttributes}
>
  {#if shape.type === 'marker'}
    <circle r={shape.radius ?? 6} fill={shape.fillColor} {stroke} stroke-width={strokeWidth} />
  {:else}
    <path
      d={shapePath(shape)}
      {fill}
      {stroke}
      stroke-width={strokeWidth}
      stroke-linejoin="round"
      stroke-linecap="round"
    />
    <!-- Keyed by position in the list, not by coordinates: two vertices ARE
         allowed to coincide while an outline is being reshaped, and a
         coordinate key makes that a duplicate-key crash mid-drag. -->
    {#each handles as handle (handle.key)}
      <circle
        {...handle.attributes}
        cx={handle.point.x}
        cy={handle.point.y}
        r={handle.radius}
        fill={handle.fill}
        stroke={handle.stroke}
        stroke-width={handle.strokeWidth}
        stroke-dasharray={handle.dash}
        class={handle.cursor}
      />
    {/each}
  {/if}
  {#if shape.label !== undefined && shape.label !== ''}
    <text y="-10" text-anchor="middle" class="fill-base-content text-[10px]">{shape.label}</text>
  {/if}
</g>
