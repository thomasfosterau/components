/**
 * VectorCanvas core types — the low-level primitives a vector-editing surface
 * is built from (a floor plan, a seating chart, a garden's bed layout).
 *
 * Shaped after ProseMirror's split: a plain-data document, a transform
 * describing a change to it, and a view that renders the document and reports
 * interactions. The application defines its own element types by extending
 * {@link CanvasElement} and supplies the renderer; nothing here knows what a
 * bed or a table is.
 *
 * @module @thomasfosterau/components/canvas/types
 */

/** Stable identity for an element. */
export type ElementId = string;

/** A point in canvas coordinates — the document's own space, not the screen's. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** What every element carries, whatever the application adds on top. */
export interface CanvasElement {
  readonly id: ElementId;
  /** The application's discriminator; the renderer switches on it. */
  readonly type: string;
  readonly position: Point;
  /** Degrees, clockwise. */
  readonly rotation: number;
  /** Paint order; higher draws later. */
  readonly zIndex: number;
  readonly strokeColor: string;
  readonly strokeWidth: number;
  readonly fillColor: string;
  /** 0–1. */
  readonly opacity: number;
  /** Whether edits are refused; the view still renders it. */
  readonly locked: boolean;
  readonly visible?: boolean | undefined;
  readonly label?: string | undefined;
  /** The application's own per-element data. */
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

/** Pan and zoom — where the document sits under the viewport. */
export interface Viewport {
  readonly offsetX: number;
  readonly offsetY: number;
  /** 1 is 100%. */
  readonly zoom: number;
}

/** The background grid, and whether it captures positions. */
export interface GridConfig {
  readonly visible: boolean;
  /** Cell size in canvas units. */
  readonly size: number;
  readonly snap: boolean;
  /** A CSS colour — a theme token in practice. */
  readonly color: string;
}

/** The whole editable document. */
export interface VectorDocument<T extends CanvasElement = CanvasElement> {
  /** Schema version, so a stored document can be migrated. */
  readonly version: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly viewport: Viewport;
  readonly grid: GridConfig;
  readonly elements: readonly T[];
}

/**
 * A change to the document, as data. Carrying the previous elements alongside
 * the new ones is what makes a transform invertible — undo is the same
 * structure read backwards, rather than a second code path.
 */
export interface Transform<T extends CanvasElement = CanvasElement> {
  readonly type: 'add' | 'update' | 'delete' | 'batch';
  readonly elementIds: readonly ElementId[];
  readonly elements?: readonly T[] | undefined;
  readonly previousElements?: readonly T[] | undefined;
}

/** One entry of an undo stack. */
export interface HistoryEntry<T extends CanvasElement = CanvasElement> {
  readonly transform: Transform<T>;
  /** Epoch milliseconds. */
  readonly timestamp: number;
  readonly description?: string | undefined;
}

/** An axis-aligned box in canvas coordinates. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
