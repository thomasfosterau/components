/**
 * File helpers for the `fields` suite.
 *
 * A file input can only be driven with a real `File`, and `ImageInput`'s
 * dimension probe decodes one for real — so the PNG below is a genuine
 * 3 × 2 image, small enough to inline. `fetch` on a data URL is the shortest
 * way to a `Blob` in a browser, and this suite runs in one.
 */

/** A real 3 × 2 PNG, 73 bytes. */
export const PNG_3x2 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAEElEQVR4nGP4z8AAQQxwFgBB0gX7h/C5SAAAAABJRU5ErkJggg==';

/** Turn a data URL into a `File` the browser will accept on an input. */
export async function fileFromDataUrl(dataUrl: string, name: string, type: string): Promise<File> {
  const response = await fetch(dataUrl);
  return new File([await response.blob()], name, { type });
}

/** A plain text file of exactly `size` bytes. */
export function textFile(name: string, size: number): File {
  return new File(['x'.repeat(size)], name, { type: 'text/plain' });
}
