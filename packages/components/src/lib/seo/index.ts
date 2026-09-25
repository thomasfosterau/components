/**
 * `@thomasfosterau/components/seo` — per-page `<head>` metadata and
 * structured data. A separate entry point: it renders only into
 * `<svelte:head>`, and a consumer that manages its own head never loads it.
 *
 * `<Head>` emits the title, canonical, `hreflang`, Open Graph and Twitter /
 * X tags; `<JsonLd>` emits one XSS-safe JSON-LD block; `serializeJsonLd` is
 * the escaping serialiser underneath it; `ogImageUrl` builds the
 * content-addressed share-card URL `<Head>` emits, with the param names and
 * caps a card renderer reads back.
 *
 * @module
 */

export { default as Head } from './Head.svelte';
export { default as JsonLd } from './JsonLd.svelte';
export { serializeJsonLd, type JsonLdObject } from './json-ld.ts';
export {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_SUBTITLE_MAX_LENGTH,
  OG_SUBTITLE_PARAM,
  OG_TITLE_MAX_LENGTH,
  OG_TITLE_PARAM,
  OG_VERSION_PARAM,
  ogImageUrl,
  type OgImageCard,
  type OgImageUrlOptions,
} from './og-image.ts';
export type {
  AlternateLink,
  FeedLink,
  HeadImage,
  OpenGraphType,
  Robots,
  SchemaPageType,
  TwitterCard,
} from './types.ts';
