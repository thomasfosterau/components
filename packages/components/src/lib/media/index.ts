/**
 * media — images, video and figures. See the package README for the family
 * reference.
 *
 * @module
 */

export { default as Image } from './Image.svelte';
export { default as Video } from './Video.svelte';
export { default as Figure } from './Figure.svelte';
export { default as Carousel } from './Carousel.svelte';
export { default as Embed } from './Embed.svelte';
export type { EmbedConsent } from './Embed.svelte';
export {
  embedSource,
  type EmbedProvider,
  type EmbedSource,
  type EmbedSourceOptions,
} from './embed-providers.ts';
export {
  imageDimensions,
  ImageDimensionsUnavailable,
  type ImageDimensions,
} from './image-dimensions.ts';
