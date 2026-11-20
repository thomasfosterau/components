/**
 * The third parties `Embed` knows, as data: how an id or URL becomes an
 * iframe `src`, a poster, a page to link to and the origins to preconnect.
 * Video providers use their privacy-enhanced hosts.
 *
 * @module
 */

/** A preset, or `generic` for an allow-listed origin. */
export type EmbedProvider = 'youtube' | 'vimeo' | 'google-maps' | 'generic';

/** What `Embed` loads, and what it shows before it does. */
export interface EmbedSource {
  /** The provider's name, for labels: "YouTube". */
  readonly name: string;
  /** Whether it plays (a video) rather than loads (a map, a post). */
  readonly video: boolean;
  /** The iframe `src`. */
  readonly src: string;
  /** A public thumbnail, where the provider has one. */
  readonly poster?: string | undefined;
  /** The content on the provider's own site: the link that works without loading the embed. */
  readonly pageHref: string;
  /** The iframe `allow` attribute. */
  readonly allow: string;
  /** Origins worth a `preconnect` once the reader shows intent. */
  readonly preconnect: readonly string[];
}

/** What `embedSource` needs beyond the provider and id. */
export interface EmbedSourceOptions {
  /** Start time in seconds, for a video. */
  readonly start?: number | undefined;
  /** Ask the player to start at once: only after the reader pressed play. */
  readonly autoplay?: boolean | undefined;
  /** The origins a `generic` embed may load from (`https://example.com`). */
  readonly allowedOrigins?: readonly string[] | undefined;
}

const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d+$/;

/** An `https:` URL, or `undefined` for anything else (`javascript:`, `data:`, junk). */
const httpsUrl = (value: string): URL | undefined => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
};

const seconds = (start: number | undefined): number | undefined =>
  start !== undefined && Number.isFinite(start) && start > 0 ? Math.floor(start) : undefined;

const youtube = (id: string, options: EmbedSourceOptions): EmbedSource | undefined => {
  if (!YOUTUBE_ID.test(id)) return undefined;
  const start = seconds(options.start);
  const src = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  if (options.autoplay === true) src.searchParams.set('autoplay', '1');
  if (start !== undefined) src.searchParams.set('start', String(start));
  const page = new URL('https://www.youtube.com/watch');
  page.searchParams.set('v', id);
  if (start !== undefined) page.searchParams.set('t', `${start}s`);
  return {
    name: 'YouTube',
    video: true,
    src: src.href,
    poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    pageHref: page.href,
    allow:
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    preconnect: ['https://www.youtube-nocookie.com', 'https://i.ytimg.com'],
  };
};

const vimeo = (id: string, options: EmbedSourceOptions): EmbedSource | undefined => {
  if (!VIMEO_ID.test(id)) return undefined;
  const start = seconds(options.start);
  const src = new URL(`https://player.vimeo.com/video/${id}`);
  src.searchParams.set('dnt', '1');
  if (options.autoplay === true) src.searchParams.set('autoplay', '1');
  if (start !== undefined) src.hash = `t=${start}s`;
  return {
    name: 'Vimeo',
    video: true,
    src: src.href,
    pageHref: `https://vimeo.com/${id}`,
    allow: 'autoplay; fullscreen; picture-in-picture',
    preconnect: ['https://player.vimeo.com'],
  };
};

/** `id` is the map's embed URL, as Google Maps' Share → Embed gives it. */
const googleMaps = (id: string): EmbedSource | undefined => {
  const url = httpsUrl(id);
  if (url?.hostname !== 'www.google.com' || !url.pathname.startsWith('/maps/embed'))
    return undefined;
  return {
    name: 'Google Maps',
    video: false,
    src: url.href,
    pageHref: url.href,
    allow: 'fullscreen',
    preconnect: ['https://www.google.com'],
  };
};

/** `id` is the URL to frame; its origin must be in `allowedOrigins`. */
const generic = (id: string, options: EmbedSourceOptions): EmbedSource | undefined => {
  const url = httpsUrl(id);
  if (url === undefined || !(options.allowedOrigins ?? []).includes(url.origin)) return undefined;
  return {
    name: url.hostname,
    video: false,
    src: url.href,
    pageHref: url.href,
    allow: '',
    preconnect: [url.origin],
  };
};

/**
 * The source for `provider` and `id`, or `undefined` when the id is not one
 * the provider uses, or a URL is not `https:` on an allowed origin.
 */
export const embedSource = (
  provider: EmbedProvider,
  id: string,
  options: EmbedSourceOptions = {},
): EmbedSource | undefined => {
  switch (provider) {
    case 'youtube':
      return youtube(id, options);
    case 'vimeo':
      return vimeo(id, options);
    case 'google-maps':
      return googleMaps(id);
    case 'generic':
      return generic(id, options);
  }
};
