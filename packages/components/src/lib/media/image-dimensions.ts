/**
 * Reading an image file's intrinsic pixel dimensions in the browser.
 *
 * A form that uploads an image wants its `width` / `height` alongside the
 * binary, so the page that later renders it can reserve the box on first
 * paint instead of reflowing when it loads — and the browser can decode the
 * file for free the moment it is chosen, where a server would have to.
 * `fields/ImageInput` measures with this; a caller with its own file control
 * uses it directly.
 *
 * @module
 */

/** An image's intrinsic size, in pixels. */
export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/** Thrown by {@link imageDimensions} where there is no `createImageBitmap` (on a server). */
export class ImageDimensionsUnavailable extends Error {
  override readonly name = 'ImageDimensionsUnavailable';
}

/**
 * Decode `file` with `createImageBitmap` and return its pixel size.
 *
 * Rejects with {@link ImageDimensionsUnavailable} outside a browser, and with
 * the browser's own error when the file does not decode as an image.
 */
export async function imageDimensions(file: Blob): Promise<ImageDimensions> {
  if (typeof globalThis.createImageBitmap !== 'function') {
    throw new ImageDimensionsUnavailable(
      'imageDimensions needs createImageBitmap, which only a browser has.',
    );
  }
  const bitmap = await globalThis.createImageBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
