/**
 * What an `Image` shows while it loads, and the inline style that paints it.
 * The placeholder is the `<img>`'s own background, so it needs no extra
 * element and shows before scripts run.
 *
 * @module
 */

/**
 * `lqip`: a tiny preview (usually a `data:` URI), stretched to the box, over
 * an optional colour. `color`: one colour, such as the image's dominant one.
 * `'skeleton'`: daisyUI's pulsing skeleton.
 */
export type ImagePlaceholder =
  | { readonly kind: 'lqip'; readonly src: string; readonly color?: string | undefined }
  | { readonly kind: 'color'; readonly value: string }
  | 'skeleton';

/** Where an `Image` is: waiting for its bytes, painted, or failed. */
export type ImagePhase = 'loading' | 'loaded' | 'error';

/** Strip what could end a declaration, so data can't add properties. */
const cssValue = (value: string): string => value.replaceAll(/[;{}]/g, '');

/** `url` percent-encoded where it could end a quoted CSS string: a quote, a backslash or a line break. */
const cssUrl = (url: string): string =>
  url.replaceAll(
    /["\\\n\r\f]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`,
  );

/** The inline style that paints `placeholder`; `undefined` for none or a skeleton. */
export const placeholderStyle = (placeholder: ImagePlaceholder | undefined): string | undefined => {
  if (placeholder === undefined || placeholder === 'skeleton') return undefined;
  if (placeholder.kind === 'color') return `background-color: ${cssValue(placeholder.value)}`;
  const image = `background-image: url("${cssUrl(placeholder.src)}"); background-size: cover; background-position: center`;
  return placeholder.color === undefined
    ? image
    : `${image}; background-color: ${cssValue(placeholder.color)}`;
};

/** `url` with a cache-busting `attempt`, for a same-origin URL; others are left alone. */
export const retryUrl = (url: string, attempt: number): string => {
  if (attempt === 0 || typeof location === 'undefined') return url;
  const parsed = new URL(url, location.href);
  if (parsed.origin !== location.origin) return url;
  parsed.searchParams.set('retry', String(attempt));
  return url.startsWith(parsed.origin)
    ? parsed.href
    : `${parsed.pathname}${parsed.search}${parsed.hash}`;
};
