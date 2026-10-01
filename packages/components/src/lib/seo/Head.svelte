<!-- @component
Per-page `<head>` metadata: title, description, canonical URL, `hreflang` alternates, Open Graph and Twitter / X tags, `article:*` and pagination links.
-->
<script lang="ts">
  /**
   * Per-page `<head>` metadata: the title (with an optional site-name
   * suffix), description, keywords, robots directive, canonical URL,
   * `hreflang` alternates, an optional feed link, Open Graph and Twitter / X
   * card tags, the `article:*` family, and `prev` / `next` pagination links.
   *
   * **Canonical on the production origin.** The explicit `canonical` wins;
   * otherwise the page self-references `pathname` resolved through
   * `canonicalHref` (the query is never part of it), so canonical and
   * `og:url` are never empty and a preview host never becomes canonical.
   * `canonicalHref` defaults to the components context's `href` — an app
   * whose `href` returns relative paths passes its own absolute resolver
   * here. `pathname` defaults to `window.location.pathname`, which does not
   * exist during SSR: a SvelteKit app passes `pathname={page.url.pathname}`.
   *
   * **Share image, in precedence order:** an explicit `image`, then a
   * per-page card built from `shareCard` by {@link ogImageUrl}, then
   * `defaultImage` — so every share renders a card when a default is set.
   *
   * **`og:type`** is derived from the Schema.org `type` when `openGraphType`
   * is not given, and the `article:*` tags are emitted only for `article`.
   * **`og:locale`** comes from `ogLocale`, else the context locale with `-`
   * replaced by `_` (`en-AU` → `en_AU`).
   *
   * Every string is a prop: `siteName` has no default (a library cannot know
   * the site), `feed.title` defaults to `'Latest changes'`, and the share
   * card's alt text defaults to `"<title> — <siteName>"` via `shareCardAlt`.
   *
   * Renders only into `<svelte:head>`; there is no markup in the body.
   */
  import { getComponentsContext } from '../context.svelte.ts';
  import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, ogImageUrl, type OgImageCard } from './og-image.ts';
  import type {
    AlternateLink,
    FeedLink,
    HeadImage,
    OpenGraphType,
    Robots,
    SchemaPageType,
    TwitterCard,
  } from './types.ts';

  interface Props {
    /** The page title. Blank renders `siteName` alone. */
    title: string;
    /** Appended to every title as `"<title><titleSeparator><siteName>"`, and emitted as `og:site_name`. */
    siteName?: string | undefined;
    /**
     * Between the title and `siteName`.
     * @defaultValue `' | '`
     */
    titleSeparator?: string;
    /** Meta and Open Graph description. */
    description?: string | null | undefined;
    /** Meta keywords. */
    keywords?: readonly string[] | undefined;
    /** The Schema.org page type — only used to derive `og:type`. */
    type?: SchemaPageType | undefined;
    /** An explicit `og:type`; wins over the one derived from `type`. */
    openGraphType?: OpenGraphType | undefined;
    /** An explicit canonical URL. Wins over `pathname`. */
    canonical?: string | undefined;
    /** The current path, resolved through `canonicalHref` into the canonical URL. */
    pathname?: string | undefined;
    /**
     * Resolves an app-relative path to an absolute URL on the production origin.
     * @defaultValue the components context’s `href`
     */
    canonicalHref?: ((path: string) => string) | undefined;
    /** Explicit `hreflang` alternates. Wins over `locales`. */
    alternates?: readonly AlternateLink[] | undefined;
    /**
     * The site's locales. Each, plus `x-default`, becomes an `hreflang`
     * alternate pointing at the canonical URL — the right signal for a site
     * whose UI chrome is localised but whose URLs are not. A site with
     * per-locale URLs passes `alternates` instead.
     */
    locales?: readonly string[] | undefined;
    /** `og:locale`, in Open Graph's `language_TERRITORY` form. */
    ogLocale?: string | undefined;
    /** An RSS, Atom or JSON Feed link. */
    feed?: FeedLink | undefined;
    /** The robots directive. */
    robots?: Robots | undefined;
    /** An explicit share image. Wins over `shareCard` and `defaultImage`. */
    image?: HeadImage | undefined;
    /** Build a per-page share card URL with {@link ogImageUrl}. */
    shareCard?: OgImageCard | undefined;
    /**
     * Where the share-card renderer is mounted.
     * @defaultValue `/og`
     */
    shareCardPath?: string | undefined;
    /**
     * The share card's alt text.
     * @defaultValue `"<card title> — <siteName>"`
     */
    shareCardAlt?: ((card: OgImageCard) => string) | undefined;
    /** The share image when neither `image` nor `shareCard` gives one. */
    defaultImage?: HeadImage | undefined;
    /** `article:published_time`. */
    published?: Date | undefined;
    /** `article:modified_time`. */
    modified?: Date | undefined;
    /** `article:section`. Blank is treated as absent. */
    section?: string | undefined;
    /** `article:tag`, one per entry. */
    tags?: readonly string[] | undefined;
    /**
     * The Twitter / X card type.
     * @defaultValue `'summary_large_image'`
     */
    twitterCard?: TwitterCard;
    /** The site’s Twitter / X handle. */
    twitterSite?: string | undefined;
    /** The author’s Twitter / X handle. */
    twitterCreator?: string | undefined;
    /** The previous page in a paginated series (`rel="prev"`). */
    prevUrl?: string | undefined;
    /** The next page in a paginated series (`rel="next"`). */
    nextUrl?: string | undefined;
  }

  let {
    title,
    siteName = undefined,
    titleSeparator = ' | ',
    description = undefined,
    keywords = undefined,
    type = undefined,
    openGraphType = undefined,
    canonical = undefined,
    pathname = undefined,
    canonicalHref = undefined,
    alternates = undefined,
    locales = undefined,
    ogLocale = undefined,
    feed = undefined,
    robots = undefined,
    image = undefined,
    shareCard = undefined,
    shareCardPath = undefined,
    shareCardAlt = undefined,
    defaultImage = undefined,
    published = undefined,
    modified = undefined,
    section = undefined,
    tags = undefined,
    twitterCard = 'summary_large_image',
    twitterSite = undefined,
    twitterCreator = undefined,
    prevUrl = undefined,
    nextUrl = undefined,
  }: Props = $props();

  const context = getComponentsContext();

  /** Schema.org type → Open Graph type, so `og:type` is never empty. */
  const schemaToOpenGraph: Record<SchemaPageType, OpenGraphType> = {
    WebPage: 'website',
    WebSite: 'website',
    CollectionPage: 'website',
    Article: 'article',
    BlogPosting: 'article',
    ProfilePage: 'profile',
  };

  const resolveHref = $derived(canonicalHref ?? context.href);

  const resolvedTitle = $derived.by(() => {
    const trimmed = title.trim();
    if (trimmed === '') return siteName ?? '';
    return siteName === undefined || siteName === '' ? trimmed : `${trimmed}${titleSeparator}${siteName}`;
  });

  const resolvedDescription = $derived(
    description === null || description === undefined || description.trim() === ''
      ? undefined
      : description,
  );

  const resolvedCanonical = $derived.by((): string | undefined => {
    if (canonical !== undefined) return canonical;
    const path = pathname ?? (typeof window === 'undefined' ? undefined : window.location.pathname);
    return path === undefined ? undefined : resolveHref(path);
  });

  const resolvedAlternates = $derived.by((): readonly AlternateLink[] => {
    if (alternates !== undefined) return alternates;
    if (resolvedCanonical === undefined || locales === undefined || locales.length === 0) return [];
    const href = resolvedCanonical;
    return [...locales, 'x-default'].map((lang) => ({ href, lang }));
  });

  const resolvedOgType = $derived(
    openGraphType ?? (type === undefined ? 'website' : schemaToOpenGraph[type]),
  );

  const resolvedOgLocale = $derived.by((): string | undefined => {
    if (ogLocale !== undefined) return ogLocale;
    const locale = context.locale();
    const first = typeof locale === 'string' ? locale : locale?.[0];
    return first === undefined ? undefined : first.replace(/-/g, '_');
  });

  const cardImage = $derived.by((): HeadImage | undefined => {
    if (image !== undefined || shareCard === undefined) return undefined;
    const url = ogImageUrl(shareCard, { href: resolveHref, basePath: shareCardPath });
    if (url === undefined) return undefined;
    const alt =
      shareCardAlt?.(shareCard) ??
      (siteName === undefined || siteName === ''
        ? shareCard.title.trim()
        : `${shareCard.title.trim()} — ${siteName}`);
    return { url, alt, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, type: 'image/png' };
  });

  const resolvedImage = $derived(image ?? cardImage ?? defaultImage);

  const robotsContent = $derived(
    `${(robots?.index ?? true) ? 'index' : 'noindex'}, ${(robots?.follow ?? true) ? 'follow' : 'nofollow'}`,
  );

  const resolvedSection = $derived(section?.trim() === '' ? undefined : section);
</script>

{#snippet articleMeta()}
  {#if published !== undefined}
    <meta property="article:published_time" content={published.toISOString()} />
  {/if}
  {#if modified !== undefined}
    <meta property="article:modified_time" content={modified.toISOString()} />
  {/if}
  {#if resolvedSection !== undefined}
    <meta property="article:section" content={resolvedSection} />
  {/if}
  {#each tags ?? [] as tag}
    <meta property="article:tag" content={tag} />
  {/each}
{/snippet}

<svelte:head>
  <title>{resolvedTitle}</title>
  {#if resolvedDescription !== undefined}
    <meta name="description" content={resolvedDescription} />
  {/if}
  {#if keywords !== undefined && keywords.length > 0}
    <meta name="keywords" content={keywords.join(', ')} />
  {/if}
  {#if resolvedCanonical !== undefined}
    <link rel="canonical" href={resolvedCanonical} />
  {/if}
  {#if feed !== undefined}
    <link
      rel="alternate"
      type={feed.type ?? 'application/feed+json'}
      href={resolveHref(feed.path)}
      title={feed.title ?? 'Latest changes'}
    />
  {/if}
  <meta name="robots" content={robotsContent} />

  <meta property="og:title" content={resolvedTitle} />
  {#if resolvedCanonical !== undefined}
    <meta property="og:url" content={resolvedCanonical} />
  {/if}
  {#if siteName !== undefined && siteName !== ''}
    <meta property="og:site_name" content={siteName} />
  {/if}
  <meta property="og:type" content={resolvedOgType} />
  {#if resolvedOgLocale !== undefined}
    <meta property="og:locale" content={resolvedOgLocale} />
  {/if}
  {#if resolvedDescription !== undefined}
    <meta property="og:description" content={resolvedDescription} />
  {/if}

  <meta name="twitter:card" content={twitterCard} />
  {#if twitterSite !== undefined}
    <meta name="twitter:site" content={twitterSite} />
  {/if}
  {#if twitterCreator !== undefined}
    <meta name="twitter:creator" content={twitterCreator} />
  {/if}
  <meta name="twitter:title" content={resolvedTitle} />
  {#if resolvedDescription !== undefined}
    <meta name="twitter:description" content={resolvedDescription} />
  {/if}

  {#if resolvedImage !== undefined}
    <meta property="og:image" content={resolvedImage.url} />
    <meta name="twitter:image" content={resolvedImage.url} />
    {#if resolvedImage.alt !== undefined && resolvedImage.alt !== ''}
      <meta property="og:image:alt" content={resolvedImage.alt} />
      <meta name="twitter:image:alt" content={resolvedImage.alt} />
    {/if}
    {#if resolvedImage.width !== undefined}
      <meta property="og:image:width" content={String(resolvedImage.width)} />
    {/if}
    {#if resolvedImage.height !== undefined}
      <meta property="og:image:height" content={String(resolvedImage.height)} />
    {/if}
    {#if resolvedImage.type !== undefined}
      <meta property="og:image:type" content={resolvedImage.type} />
    {/if}
  {/if}

  {#if resolvedOgType === 'article'}
    {@render articleMeta()}
  {/if}

  {#each resolvedAlternates as alternate}
    <link rel="alternate" href={alternate.href} hreflang={alternate.lang} />
  {/each}
  {#if prevUrl !== undefined}
    <link rel="prev" href={prevUrl} />
  {/if}
  {#if nextUrl !== undefined}
    <link rel="next" href={nextUrl} />
  {/if}
</svelte:head>
