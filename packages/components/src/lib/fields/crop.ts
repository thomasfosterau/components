/**
 * The geometry behind `ImageCropper`: a fixed frame over a movable image.
 * The image is turned by a quarter-turn `rotation` (the "rotated image"),
 * then by a small `straighten` angle; the frame is axis-aligned on screen
 * and must always be covered by the image.
 *
 * @module
 */

/** A quarter-turn, clockwise. */
export type CropRotation = 0 | 90 | 180 | 270;

/** A width and height in pixels. */
export interface CropSize {
  readonly width: number;
  readonly height: number;
}

/** A 2D vector or point. */
export interface CropPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * The crop, in the pixels of the source image after `rotation` is applied:
 * rotate the source by `rotation`, then cut out this rectangle turned
 * clockwise by `straighten` degrees about its own centre.
 */
export interface CropArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: CropRotation;
  readonly straighten: number;
}

/**
 * The cropper's state: how far it is zoomed, where the frame's centre is
 * (as an offset from the rotated image's centre, in its pixels) and the turn.
 */
export interface CropView {
  readonly zoom: number;
  readonly centre: CropPoint;
  readonly rotation: CropRotation;
  readonly straighten: number;
}

/** The fixed inputs: the source's size, the frame's aspect ratio and the zoom range. */
export interface CropFrame {
  readonly source: CropSize;
  readonly aspect: number;
  readonly minZoom: number;
  readonly maxZoom: number;
}

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Turn a vector clockwise (on a y-down screen) by `degrees`. */
export function rotatePoint(point: CropPoint, degrees: number): CropPoint {
  const angle = radians(degrees);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

/** The source's size after a quarter-turn. */
export const rotatedSize = (source: CropSize, rotation: CropRotation): CropSize =>
  rotation === 90 || rotation === 270 ? { width: source.height, height: source.width } : source;

const turn = (degrees: number): { readonly cos: number; readonly sin: number } => ({
  cos: Math.abs(Math.cos(radians(degrees))),
  sin: Math.abs(Math.sin(radians(degrees))),
});

/** The crop's size: the largest frame-shaped rectangle the straightened image covers, divided by the zoom. */
export function cropSize(frame: CropFrame, view: CropView): CropSize {
  const image = rotatedSize(frame.source, view.rotation);
  const { cos, sin } = turn(view.straighten);
  const fit = Math.min(
    image.width / (frame.aspect * cos + sin),
    image.height / (frame.aspect * sin + cos),
  );
  const height = fit / view.zoom;
  return { width: height * frame.aspect, height };
}

const clampNumber = (value: number, limit: number): number =>
  Math.min(Math.max(value, -limit), limit);

/**
 * Keep the zoom in range and the frame covered: the crop, turned into the
 * rotated image's axes, must lie wholly inside it.
 */
export function clampView(frame: CropFrame, view: CropView): CropView {
  const zoom = Math.min(Math.max(view.zoom, frame.minZoom), frame.maxZoom);
  const zoomed = { ...view, zoom };
  const image = rotatedSize(frame.source, view.rotation);
  const crop = cropSize(frame, zoomed);
  const { cos, sin } = turn(view.straighten);
  const halfX = (crop.width * cos + crop.height * sin) / 2;
  const halfY = (crop.width * sin + crop.height * cos) / 2;
  return {
    ...zoomed,
    centre: {
      x: clampNumber(view.centre.x, Math.max(0, image.width / 2 - halfX)),
      y: clampNumber(view.centre.y, Math.max(0, image.height / 2 - halfY)),
    },
  };
}

/** The starting view: centred, fully zoomed out, level. */
export const initialView = (frame: CropFrame): CropView => ({
  zoom: frame.minZoom,
  centre: { x: 0, y: 0 },
  rotation: 0,
  straighten: 0,
});

/** Move the frame by a vector in screen axes, measured in rotated-image pixels. */
export function panView(frame: CropFrame, view: CropView, delta: CropPoint): CropView {
  const step = rotatePoint(delta, -view.straighten);
  return clampView(frame, {
    ...view,
    centre: { x: view.centre.x + step.x, y: view.centre.y + step.y },
  });
}

/**
 * Zoom so the point `focus` (a vector from the frame's centre, in screen axes
 * and current rotated-image pixels) stays where it is on screen.
 */
export function zoomView(
  frame: CropFrame,
  view: CropView,
  zoom: number,
  focus: CropPoint,
): CropView {
  const next = Math.min(Math.max(zoom, frame.minZoom), frame.maxZoom);
  const before = rotatePoint(focus, -view.straighten);
  const after = rotatePoint(
    { x: (focus.x * view.zoom) / next, y: (focus.y * view.zoom) / next },
    -view.straighten,
  );
  return clampView(frame, {
    ...view,
    zoom: next,
    centre: { x: view.centre.x + before.x - after.x, y: view.centre.y + before.y - after.y },
  });
}

/** A quarter-turn clockwise, carrying the frame's position round with the image. */
export function rotateView(frame: CropFrame, view: CropView): CropView {
  const rotation: CropRotation =
    view.rotation === 270 ? 0 : view.rotation === 0 ? 90 : view.rotation === 90 ? 180 : 270;
  return clampView(frame, { ...view, rotation, centre: rotatePoint(view.centre, 90) });
}

/** The crop rectangle the view selects. */
export function areaOf(frame: CropFrame, view: CropView): CropArea {
  const image = rotatedSize(frame.source, view.rotation);
  const crop = cropSize(frame, view);
  return {
    x: image.width / 2 + view.centre.x - crop.width / 2,
    y: image.height / 2 + view.centre.y - crop.height / 2,
    width: crop.width,
    height: crop.height,
    rotation: view.rotation,
    straighten: view.straighten,
  };
}

/** The view that selects an area, so a saved crop can be reopened. */
export function viewOf(frame: CropFrame, area: CropArea): CropView {
  const image = rotatedSize(frame.source, area.rotation);
  const full = cropSize(frame, {
    zoom: 1,
    centre: { x: 0, y: 0 },
    rotation: area.rotation,
    straighten: area.straighten,
  });
  return clampView(frame, {
    zoom: full.width / area.width,
    centre: {
      x: area.x + area.width / 2 - image.width / 2,
      y: area.y + area.height / 2 - image.height / 2,
    },
    rotation: area.rotation,
    straighten: area.straighten,
  });
}

/** The steps that draw the source so the crop fills an output of `output` pixels; shared by the preview and the export. */
export interface CropTransform {
  /** The output's centre. */
  readonly origin: CropPoint;
  /** Straighten, in degrees. */
  readonly straighten: number;
  /** Output pixels per rotated-image pixel. */
  readonly scale: number;
  /** The frame centre's offset, to undo. */
  readonly centre: CropPoint;
  /** Quarter-turn, in degrees. */
  readonly rotation: CropRotation;
  /** The source's centre, to undo. */
  readonly sourceCentre: CropPoint;
}

/** The transform that maps the source onto an output of the given width. */
export function cropTransform(frame: CropFrame, view: CropView, output: CropSize): CropTransform {
  return {
    origin: { x: output.width / 2, y: output.height / 2 },
    straighten: view.straighten,
    scale: output.width / cropSize(frame, view).width,
    centre: view.centre,
    rotation: view.rotation,
    sourceCentre: { x: frame.source.width / 2, y: frame.source.height / 2 },
  };
}

/** The transform as a CSS `transform`, for an image at the frame's top-left with `transform-origin: 0 0`. */
export const cssTransform = (t: CropTransform): string =>
  [
    `translate(${t.origin.x}px, ${t.origin.y}px)`,
    `rotate(${t.straighten}deg)`,
    `scale(${t.scale})`,
    `translate(${-t.centre.x}px, ${-t.centre.y}px)`,
    `rotate(${t.rotation}deg)`,
    `translate(${-t.sourceCentre.x}px, ${-t.sourceCentre.y}px)`,
  ].join(' ');

/** Where, in thirds, the frame sits on each axis of the rotated image. */
export interface CropPlace {
  readonly horizontal: 'left' | 'centre' | 'right';
  readonly vertical: 'top' | 'middle' | 'bottom';
}

const third = <T>(offset: number, half: number, names: readonly [T, T, T]): T => {
  const ratio = half > 0 ? offset / half : 0;
  if (ratio < -1 / 3) {
    return names[0];
  }
  return ratio > 1 / 3 ? names[2] : names[1];
};

/** What the frame shows: the share of the image's width and where it sits. */
export interface CropReadout {
  /** The share of the rotated image's width in the frame, 0–1. */
  readonly widthShare: number;
  readonly place: CropPlace;
}

/** Describe the view for the live readout. */
export function readoutOf(frame: CropFrame, view: CropView): CropReadout {
  const image = rotatedSize(frame.source, view.rotation);
  const crop = cropSize(frame, view);
  const freeX = (image.width - crop.width) / 2;
  const freeY = (image.height - crop.height) / 2;
  return {
    widthShare: crop.width / image.width,
    place: {
      horizontal: third(view.centre.x, freeX, ['left', 'centre', 'right'] as const),
      vertical: third(view.centre.y, freeY, ['top', 'middle', 'bottom'] as const),
    },
  };
}

/** The English readout: "Showing 62% of the width, centred", "…, towards the top left". */
export function defaultCropReadout({ widthShare, place }: CropReadout): string {
  const share = `Showing ${Math.round(widthShare * 100)}% of the width`;
  const parts = [
    place.vertical === 'middle' ? '' : place.vertical,
    place.horizontal === 'centre' ? '' : place.horizontal,
  ]
    .filter(Boolean)
    .join(' ');
  return parts === '' ? `${share}, centred` : `${share}, towards the ${parts}`;
}

/** The English straighten value: "Level", "3 degrees clockwise". */
export function defaultStraightenText(degrees: number): string {
  if (degrees === 0) {
    return 'Level';
  }
  const amount = Math.abs(degrees);
  return `${amount} ${amount === 1 ? 'degree' : 'degrees'} ${degrees > 0 ? 'clockwise' : 'anticlockwise'}`;
}
