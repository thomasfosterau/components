/**
 * The content-addressed Open Graph share-image URL builder.
 *
 * Shared by `<Head>` (which emits the URL as `og:image`) and whatever renders
 * the card (an app route or Worker reading the same query params), so the
 * producer and the consumer of the URL can never disagree on the param names
 * or the length caps — import the constants below on both sides.
 *
 * The URL is **content-addressed**: the title and description ride in the
 * query, and a `v` token derived from the content's last-modified instant
 * changes the whole URL whenever the content changes. A new URL is how the
 * image cache-busts — link-preview scrapers (Facebook, LinkedIn, federated
 * servers) cache aggressively and only re-fetch a URL they have not seen, so
 * the version token is load-bearing, not cosmetic.
 *
 * @module
 */

/** Query param carrying the card title. */
export const OG_TITLE_PARAM = 't';
/** Query param carrying the card's second line (the page description). */
export const OG_SUBTITLE_PARAM = 'd';
/** Query param carrying the cache-busting version token. */
export const OG_VERSION_PARAM = 'v';

/**
 * Length caps on the title / description carried in the URL. A renderer
 * should re-apply them defensively; here they keep the emitted URL short.
 */
export const OG_TITLE_MAX_LENGTH = 120;
export const OG_SUBTITLE_MAX_LENGTH = 200;

/** The rendered card's size — the 1.91:1 Open Graph standard. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** What a per-page share card is built from. */
export interface OgImageCard {
  /** The page title — the card headline. A blank title builds no URL. */
  readonly title: string;
  /** Optional second line (the page description). */
  readonly description?: string | null | undefined;
  /**
   * A stable, opaque identity for the page (a content UUID, a slug), used only
   * to build the readable `<slug>.png` path segment. Never rendered.
   */
  readonly id: string;
  /**
   * The content's last-modified instant, or anything that changes when the
   * card should. Drives the version token; absent or unparseable, the URL is
   * keyed by title + description alone.
   */
  readonly updatedAt?: Date | string | number | null | undefined;
}

export interface OgImageUrlOptions {
  /**
   * Resolves the card's path to the href emitted — the production origin, so
   * the URL is absolute (`og:image` must be). `<Head>` passes its
   * `canonicalHref`, which defaults to the components context's `href`.
   * Defaults to the identity.
   */
  readonly href?: ((path: string) => string) | undefined;
  /** The path the card renderer is mounted at. Default `/og`. */
  readonly basePath?: string | undefined;
}

/**
 * Reduce an identity to a short URL-safe slug. Cosmetic — a renderer should
 * ignore it — so an empty or garbage id collapses to a stable fallback rather
 * than an invalid path.
 */
const toSlug = (id: string): string => {
  const slug = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug === '' ? 'page' : slug;
};

/** Epoch milliseconds of `updatedAt`, or `undefined` when absent or unparseable. */
const versionToken = (updatedAt: OgImageCard['updatedAt']): string | undefined => {
  if (updatedAt === null || updatedAt === undefined) return undefined;
  const time =
    updatedAt instanceof Date
      ? updatedAt.getTime()
      : typeof updatedAt === 'number'
        ? updatedAt
        : Date.parse(updatedAt);
  return Number.isFinite(time) ? String(time) : undefined;
};

/**
 * Build the `og:image` URL for a page's share card: `<basePath>/<slug>.png`
 * resolved through `href`, with the title, description and version token in
 * the query. Returns `undefined` for a blank title, so the caller falls back
 * to its default share image.
 */
export function ogImageUrl(card: OgImageCard, options: OgImageUrlOptions = {}): string | undefined {
  const title = card.title.trim();
  if (title === '') return undefined;

  const params = new URLSearchParams();
  params.set(OG_TITLE_PARAM, title.slice(0, OG_TITLE_MAX_LENGTH));

  const description = card.description?.trim();
  if (description !== undefined && description !== '') {
    params.set(OG_SUBTITLE_PARAM, description.slice(0, OG_SUBTITLE_MAX_LENGTH));
  }

  const version = versionToken(card.updatedAt);
  if (version !== undefined) params.set(OG_VERSION_PARAM, version);

  const basePath = (options.basePath ?? '/og').replace(/\/+$/, '');
  const href = options.href ?? ((path: string) => path);
  return `${href(`${basePath}/${toSlug(card.id)}.png`)}?${params.toString()}`;
}
