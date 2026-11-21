/**
 * `SignaturePad`'s geometry and export: thinning and smoothing strokes into
 * SVG paths (Catmull-Rom curves, hand-rolled rather than a freehand
 * library), and serialising a drawn or typed signature as SVG or PNG.
 *
 * @module
 */

/** A point in the pad's own units: `x` across `0…aspect × 100`, `y` down `0…100`. */
export interface SignaturePoint {
  readonly x: number;
  readonly y: number;
}

/** One stroke: the points from pointer down to pointer up. */
export type SignatureStroke = readonly SignaturePoint[];

/** A signature, drawn or typed, with its SVG. */
export interface SignatureValue {
  readonly kind: 'drawn' | 'typed';
  /** A standalone SVG document. */
  readonly svg: string;
  /** The typed name, when `kind` is `'typed'`. */
  readonly typedName?: string | undefined;
}

/** The pad's height in its own units; the width is `aspect` times this. */
export const padHeight = 100;

/**
 * The stroke colour in exported SVG and PNG. Export data rather than UI, so
 * it is a fixed dark ink that prints the same from a dark theme.
 */
export const exportInk = '#1f2937';

/** Stroke widths, in pad units. */
export const strokeWidths = { sm: 1.5, md: 2.5, lg: 4 } as const;

const round = (value: number): number => Math.round(value * 10) / 10;

/** Drop points closer than `minDistance` to the previous kept one, so a slow hand doesn't bloat the path. */
export const thin = (stroke: SignatureStroke, minDistance = 0.6): SignaturePoint[] => {
  const kept: SignaturePoint[] = [];
  for (const point of stroke) {
    const last = kept.at(-1);
    if (last === undefined || Math.hypot(point.x - last.x, point.y - last.y) >= minDistance) {
      kept.push(point);
    }
  }
  return kept;
};

/**
 * A stroke as an SVG path: a Catmull-Rom curve through its points, as
 * cubic Béziers. A single point is a dot (a zero-length line that a round
 * cap draws).
 */
export const strokePath = (stroke: SignatureStroke): string => {
  const points = thin(stroke);
  const first = points[0];
  if (first === undefined) return '';
  const start = `M${round(first.x)} ${round(first.y)}`;
  if (points.length === 1) return `${start}l0 0.1`;
  const at = (index: number): SignaturePoint =>
    points[Math.min(Math.max(index, 0), points.length - 1)] ?? first;
  let path = start;
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = at(index - 1);
    const from = at(index);
    const to = at(index + 1);
    const after = at(index + 2);
    const c1x = from.x + (to.x - before.x) / 6;
    const c1y = from.y + (to.y - before.y) / 6;
    const c2x = to.x - (after.x - from.x) / 6;
    const c2y = to.y - (after.y - from.y) / 6;
    path += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(to.x)} ${round(to.y)}`;
  }
  return path;
};

const escapeXml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const svgOpen = (aspect: number): string => {
  const width = aspect * padHeight;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${padHeight}" width="${width * 4}" height="${padHeight * 4}">`;
};

/** Drawn strokes as a standalone SVG document, one `<path>` per stroke. */
export const strokesToSvg = (
  strokes: readonly SignatureStroke[],
  options: { readonly aspect: number; readonly strokeWidth: number },
): string => {
  const paths = strokes
    .map(
      (stroke) =>
        `<path d="${strokePath(stroke)}" fill="none" stroke="${exportInk}" stroke-width="${options.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  return `${svgOpen(options.aspect)}${paths}</svg>`;
};

/** The font stack the typed signature is set in. */
export const scriptFont = "'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive";

/** A typed name as a standalone SVG document, set in a script face. */
export const typedToSvg = (name: string, options: { readonly aspect: number }): string => {
  const width = options.aspect * padHeight;
  return `${svgOpen(options.aspect)}<text x="${width / 2}" y="62" text-anchor="middle" font-family="${escapeXml(scriptFont)}" font-size="36" fill="${exportInk}">${escapeXml(name)}</text></svg>`;
};

/** A signature as a PNG of the given pixel size, drawn on a white background. */
export const signatureToPng = async (
  value: SignatureValue,
  size: { readonly width: number; readonly height: number },
): Promise<Blob> => {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value.svg)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('signatureToPng: no 2D canvas context');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0, size.width, size.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) reject(new Error('signatureToPng: the canvas produced no PNG'));
      else resolve(blob);
    }, 'image/png');
  });
};
