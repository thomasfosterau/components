/**
 * The data shapes `<Head>` takes.
 *
 * @module
 */

/** The Open Graph `og:type` values `<Head>` emits. */
export type OpenGraphType = 'website' | 'article' | 'profile';

/**
 * The Schema.org page types `<Head>` understands, used only to derive
 * `og:type` when `openGraphType` is not given (so it is never empty).
 */
export type SchemaPageType =
  | 'WebPage'
  | 'WebSite'
  | 'CollectionPage'
  | 'Article'
  | 'BlogPosting'
  | 'ProfilePage';

/** The Twitter / X card variants. */
export type TwitterCard = 'summary' | 'summary_large_image';

/** A social preview image. `url` must be absolute. */
export interface HeadImage {
  readonly url: string;
  readonly alt?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  /** The MIME type, e.g. `image/png`. */
  readonly type?: string | undefined;
}

/** One `<link rel="alternate" hreflang>`. */
export interface AlternateLink {
  readonly href: string;
  /** A BCP 47 tag, or `x-default`. */
  readonly lang: string;
}

/** The `robots` meta directive. Both default to `true`. */
export interface Robots {
  readonly index?: boolean | undefined;
  readonly follow?: boolean | undefined;
}

/** A feed advertised with `<link rel="alternate">`. */
export interface FeedLink {
  /** App-relative path, resolved through `canonicalHref` like the canonical URL. */
  readonly path: string;
  /** The feed's title. Default `'Latest changes'`. */
  readonly title?: string | undefined;
  /** The feed's MIME type. Default `application/feed+json` (JSON Feed 1.1). */
  readonly type?: string | undefined;
}
