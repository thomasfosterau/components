/**
 * Draws an `ImageCropper` crop to an image in the browser. `createImageBitmap`
 * applies the file's EXIF orientation, so the crop matches what was shown.
 *
 * @module
 */

import { cropSize, cropTransform, type CropFrame, type CropView } from './crop.ts';

/** How to encode the exported crop. */
export interface CropExportOptions {
  /**
   * The image type.
   * @defaultValue `'image/png'`
   */
  readonly type?: string | undefined;
  /** Encoder quality, 0–1, for lossy types. */
  readonly quality?: number | undefined;
  /** Largest output width or height, in pixels; the crop is scaled down to fit, never up. */
  readonly maxSize?: number | undefined;
}

const sourceBlob = async (src: Blob | string): Promise<Blob> =>
  typeof src === 'string' ? (await fetch(src)).blob() : src;

const encode = async (
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number | undefined,
): Promise<Blob> => {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, ...(quality === undefined ? {} : { quality }) });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The crop could not be encoded.'))),
      type,
      quality,
    );
  });
};

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

interface Surface {
  readonly canvas: OffscreenCanvas | HTMLCanvasElement;
  readonly context: Context2D | null;
}

const makeSurface = (width: number, height: number): Surface => {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, context: canvas.getContext('2d') };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, context: canvas.getContext('2d') };
};

/** Draw the crop the view selects, scaled to fit `maxSize`, and encode it. */
export async function exportCrop(
  src: Blob | string,
  frame: CropFrame,
  view: CropView,
  options: CropExportOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(await sourceBlob(src));
  const crop = cropSize(frame, view);
  const fit =
    options.maxSize === undefined
      ? 1
      : Math.min(1, options.maxSize / Math.max(crop.width, crop.height));
  const width = Math.max(1, Math.round(crop.width * fit));
  const height = Math.max(1, Math.round(crop.height * fit));
  const { canvas, context } = makeSurface(width, height);
  if (!context) {
    bitmap.close();
    throw new Error('A 2D canvas is not available.');
  }
  const t = cropTransform(frame, view, { width, height });
  context.translate(t.origin.x, t.origin.y);
  context.rotate((t.straighten * Math.PI) / 180);
  context.scale(t.scale, t.scale);
  context.translate(-t.centre.x, -t.centre.y);
  context.rotate((t.rotation * Math.PI) / 180);
  context.drawImage(bitmap, -t.sourceCentre.x, -t.sourceCentre.y);
  bitmap.close();
  return encode(canvas, options.type ?? 'image/png', options.quality);
}
