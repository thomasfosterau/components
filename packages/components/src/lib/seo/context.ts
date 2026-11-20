/**
 * Site-wide defaults for `<Head>`: what is the same on every page of a site,
 * set once in the root layout so pages pass only what is their own. Every
 * member is optional, and a prop given to `<Head>` always wins over it.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';
import type { OgImageCard } from './og-image.ts';
import type { FeedLink, HeadImage, Robots, TwitterCard } from './types.ts';

/** What `setSeoContext` takes: `<Head>`'s site-wide defaults. */
export interface SeoContext {
  /** The title suffix, the blank-title fallback and `og:site_name`. */
  readonly siteName?: string | undefined;
  /** Between the title and `siteName`. */
  readonly titleSeparator?: string | undefined;
  /** The description of a page that has none (or a blank one). */
  readonly description?: string | undefined;
  /**
   * The current path, read on every render. SvelteKit: `() => page.url.pathname`,
   * which, unlike `window.location`, exists during SSR.
   */
  readonly pathname?: (() => string) | undefined;
  /** Resolves an app-relative path to an absolute URL on the production origin. */
  readonly canonicalHref?: ((path: string) => string) | undefined;
  /** The site's locales, for `hreflang` alternates at the canonical URL. */
  readonly locales?: readonly string[] | undefined;
  /** `og:locale`, in Open Graph's `language_TERRITORY` form. */
  readonly ogLocale?: string | undefined;
  /** The site's feed link or links. */
  readonly feed?: FeedLink | readonly FeedLink[] | undefined;
  /** The robots directive of a page that sets none. */
  readonly robots?: Robots | undefined;
  /** The share image when a page gives neither `image` nor `shareCard`. */
  readonly defaultImage?: HeadImage | undefined;
  /** Where the share-card renderer is mounted. */
  readonly shareCardPath?: string | undefined;
  /** The share card's alt text. */
  readonly shareCardAlt?: ((card: OgImageCard) => string) | undefined;
  /** The Twitter / X card type. */
  readonly twitterCard?: TwitterCard | undefined;
  /** The site's Twitter / X handle. */
  readonly twitterSite?: string | undefined;
}

const SEO_CONTEXT_KEY = Symbol('@thomasfosterau/components:seo');

/** Provide `<Head>`'s site-wide defaults. Call once, high in the tree (the root layout). */
export function setSeoContext(context: SeoContext): void {
  setContext<SeoContext>(SEO_CONTEXT_KEY, context);
}

/** Read `<Head>`'s site-wide defaults; empty when no provider is mounted. */
export function getSeoContext(): SeoContext {
  return getContext<SeoContext | undefined>(SEO_CONTEXT_KEY) ?? {};
}
