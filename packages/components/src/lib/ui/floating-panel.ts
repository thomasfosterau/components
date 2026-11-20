/**
 * The geometry and the shared state behind `FloatingPanel`: clamping a rect
 * to its boundary, keyboard moves and resizes, edge snapping, keeping a rect
 * in proportion when the boundary resizes, the stacking order, and the F6
 * ring that cycles focus between open panels and the page.
 *
 * @module
 */

/** A panel's position and size, in pixels from its boundary's top-left corner. */
export interface PanelRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A width and height in pixels. */
export interface PanelSize {
  readonly width: number;
  readonly height: number;
}

/** How a panel is shown: as placed, collapsed to its title bar, or filling its boundary. */
export type PanelStage = 'default' | 'minimized' | 'maximized';

/** Where a panel sits in its boundary, in thirds, for the move announcement. */
export interface PanelPlace {
  readonly vertical: 'top' | 'middle' | 'bottom';
  readonly horizontal: 'left' | 'centre' | 'right';
}

/** Size limits for a panel. */
export interface PanelLimits {
  readonly min: PanelSize;
  readonly max: PanelSize;
}

/** The default size limits: no smaller than a usable title bar and a line or two. */
export const defaultPanelLimits: PanelLimits = {
  min: { width: 160, height: 96 },
  max: { width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY },
};

/** How close, in pixels, a dropped panel must be to an edge to snap to it. */
export const SNAP_DISTANCE = 24;

const clampNumber = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), Math.max(low, high));

/** Fit a size within the limits and the boundary. */
const clampSize = (rect: PanelRect, bounds: PanelSize, limits: PanelLimits): PanelSize => ({
  width: clampNumber(rect.width, limits.min.width, Math.min(limits.max.width, bounds.width)),
  height: clampNumber(rect.height, limits.min.height, Math.min(limits.max.height, bounds.height)),
});

/**
 * Keep a rect within its limits and wholly inside the boundary. An unmeasured
 * boundary (zero size) leaves it untouched.
 */
export function clampRect(rect: PanelRect, bounds: PanelSize, limits: PanelLimits): PanelRect {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return rect;
  }
  const { width, height } = clampSize(rect, bounds, limits);
  return {
    x: clampNumber(rect.x, 0, bounds.width - width),
    y: clampNumber(rect.y, 0, bounds.height - height),
    width,
    height,
  };
}

/** Move a rect by a pixel offset, staying inside the boundary. */
export const moveRect = (
  rect: PanelRect,
  dx: number,
  dy: number,
  bounds: PanelSize,
  limits: PanelLimits,
): PanelRect => clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, bounds, limits);

/** Grow or shrink a rect from its bottom-right corner, within its limits and the boundary. */
export function resizeRect(
  rect: PanelRect,
  dw: number,
  dh: number,
  bounds: PanelSize,
  limits: PanelLimits,
): PanelRect {
  const sized = clampSize(
    { ...rect, width: rect.width + dw, height: rect.height + dh },
    bounds,
    limits,
  );
  return {
    ...rect,
    width: Math.min(sized.width, bounds.width > 0 ? bounds.width - rect.x : sized.width),
    height: Math.min(sized.height, bounds.height > 0 ? bounds.height - rect.y : sized.height),
  };
}

const snapAxis = (start: number, size: number, extent: number): number => {
  if (start < SNAP_DISTANCE) {
    return 0;
  }
  return extent - (start + size) < SNAP_DISTANCE ? extent - size : start;
};

/** Pull a rect flush to any boundary edge it was dropped within {@link SNAP_DISTANCE} of. */
export const snapRect = (rect: PanelRect, bounds: PanelSize): PanelRect => ({
  ...rect,
  x: snapAxis(rect.x, rect.width, bounds.width),
  y: snapAxis(rect.y, rect.height, bounds.height),
});

const proportion = (start: number, size: number, from: number, to: number): number => {
  const free = from - size;
  return free > 0 ? (start / free) * (to - size) : start;
};

/**
 * Carry a rect across a boundary resize: its position keeps the same fraction
 * of the free space on each axis, so a panel in the far corner stays there.
 */
export function rescaleRect(
  rect: PanelRect,
  from: PanelSize,
  to: PanelSize,
  limits: PanelLimits,
): PanelRect {
  if (from.width <= 0 || from.height <= 0) {
    return clampRect(rect, to, limits);
  }
  return clampRect(
    {
      ...rect,
      x: proportion(rect.x, rect.width, from.width, to.width),
      y: proportion(rect.y, rect.height, from.height, to.height),
    },
    to,
    limits,
  );
}

const third = <T>(start: number, size: number, extent: number, names: readonly [T, T, T]): T => {
  const centre = (start + size / 2) / extent;
  if (centre < 1 / 3) {
    return names[0];
  }
  return centre > 2 / 3 ? names[2] : names[1];
};

/** Which third of the boundary, on each axis, a rect's centre is in. */
export const placeOf = (rect: PanelRect, bounds: PanelSize): PanelPlace => ({
  vertical: third(rect.y, rect.height, bounds.height, ['top', 'middle', 'bottom'] as const),
  horizontal: third(rect.x, rect.width, bounds.width, ['left', 'centre', 'right'] as const),
});

/** The English move announcement: "Moved to top right", or "Moved to the centre". */
export function defaultMovedAnnouncement(place: PanelPlace): string {
  if (place.vertical === 'middle' && place.horizontal === 'centre') {
    return 'Moved to the centre';
  }
  if (place.vertical === 'middle') {
    return `Moved to the ${place.horizontal}`;
  }
  return place.horizontal === 'centre'
    ? `Moved to the ${place.vertical}`
    : `Moved to ${place.vertical} ${place.horizontal}`;
}

/** The English resize announcement: "Resized to 320 by 240". */
export const defaultResizedAnnouncement = (size: PanelSize): string =>
  `Resized to ${Math.round(size.width)} by ${Math.round(size.height)}`;

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** The keys a panel's title bar handles, as a change to apply. */
export type PanelKeyAction =
  | { readonly kind: 'move'; readonly rect: PanelRect }
  | { readonly kind: 'resize'; readonly rect: PanelRect }
  | { readonly kind: 'toggle-maximize' };

/** What a key on the title bar does: modifiers pick the step (Alt: 1 px) and move or resize (Shift). */
export interface PanelKey {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

const arrowAction = (
  [dx, dy]: readonly [number, number],
  event: PanelKey,
  rect: PanelRect,
  bounds: PanelSize,
  limits: PanelLimits,
): PanelKeyAction => {
  const step = event.altKey ? 1 : 10;
  return event.shiftKey
    ? { kind: 'resize', rect: resizeRect(rect, dx * step, dy * step, bounds, limits) }
    : { kind: 'move', rect: moveRect(rect, dx * step, dy * step, bounds, limits) };
};

/**
 * Translate a title-bar key into a change: arrows move by 10 px (Alt: 1 px),
 * Shift+arrows resize, Home and End snap to the start and end edge, Enter and
 * Space toggle maximise. Any other key is `undefined`.
 */
export function panelKeyAction(
  event: PanelKey,
  rect: PanelRect,
  bounds: PanelSize,
  limits: PanelLimits,
): PanelKeyAction | undefined {
  const arrow = ARROWS[event.key];
  if (arrow) {
    return arrowAction(arrow, event, rect, bounds, limits);
  }
  switch (event.key) {
    case 'Home':
      return { kind: 'move', rect: clampRect({ ...rect, x: 0 }, bounds, limits) };
    case 'End':
      return {
        kind: 'move',
        rect: clampRect({ ...rect, x: bounds.width - rect.width }, bounds, limits),
      };
    case 'Enter':
    case ' ':
      return { kind: 'toggle-maximize' };
    default:
      return undefined;
  }
}

/** The stacking base for floating panels: above page content, below modal layers. */
const Z_BASE = 20;

let zTop = Z_BASE;

/** The next stacking index, for the panel just brought to the front. */
export const nextPanelZ = (): number => {
  zTop += 1;
  return zTop;
};

/** A panel's part in the F6 ring. */
interface PanelRingEntry {
  /** The panel element. */
  readonly element: HTMLElement;
  /** Move focus into the panel. */
  readonly focus: () => void;
}

/**
 * The F6 ring: one window listener shared by every open panel, cycling focus
 * from the page through each panel and back (Shift+F6 goes the other way).
 */
class PanelRing {
  readonly #entries = new Set<PanelRingEntry>();
  #lastPageFocus: HTMLElement | undefined;

  #owner = (node: EventTarget | null): PanelRingEntry | undefined =>
    node instanceof Node
      ? [...this.#entries].find((entry) => entry.element.contains(node))
      : undefined;

  #onFocusIn = (event: FocusEvent): void => {
    if (event.target instanceof HTMLElement && !this.#owner(event.target)) {
      this.#lastPageFocus = event.target;
    }
  };

  #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'F6' || event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    this.cycle(event.shiftKey ? -1 : 1);
  };

  /** Focus the next stop in the ring: the page, then each open panel in opening order. */
  cycle(direction: 1 | -1): void {
    const entries = [...this.#entries];
    const current = this.#owner(document.activeElement);
    const stops = entries.length + 1;
    const index = current ? entries.indexOf(current) + 1 : 0;
    const next = (index + direction + stops) % stops;
    if (next === 0) {
      this.returnToPage();
    } else {
      entries[next - 1]?.focus();
    }
  }

  /** Give focus back to whatever on the page last had it. */
  returnToPage(): void {
    const target = this.#lastPageFocus;
    if (target?.isConnected) {
      target.focus();
    } else if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  /** Join the ring; the returned function leaves it. */
  add(entry: PanelRingEntry): () => void {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !this.#owner(active)) {
      this.#lastPageFocus = active;
    }
    if (this.#entries.size === 0) {
      window.addEventListener('keydown', this.#onKeyDown);
      document.addEventListener('focusin', this.#onFocusIn);
    }
    this.#entries.add(entry);
    return () => {
      this.#entries.delete(entry);
      if (this.#entries.size === 0) {
        window.removeEventListener('keydown', this.#onKeyDown);
        document.removeEventListener('focusin', this.#onFocusIn);
      }
    };
  }
}

/** The one ring every `FloatingPanel` joins. */
export const panelRing = /* @__PURE__ */ new PanelRing();
