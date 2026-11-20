<!-- @component
A click-to-load facade for a third-party iframe (YouTube, Vimeo, Google Maps, an allow-listed origin): a poster, one button and a link, and nothing loaded from the third party until the reader asks.
-->
<!--
  The button is named by `playLabel` or `loadLabel` and described by the
  privacy notice; the link to the provider's page works without scripts.
  Activating swaps in the iframe and moves focus into it. `consent` gates
  loading on a category the app tracks.
-->
<script lang="ts">
  import { Play } from '@lucide/svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { embedSource, type EmbedProvider } from './embed-providers.ts';

  /** A consent category the app tracks: whether it is granted, and how to grant it. */
  export interface EmbedConsent {
    readonly granted: boolean;
    /** Records consent; the embed loads once it settles. */
    readonly grant: () => void | Promise<void>;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    /** Whose embed this is. */
    provider: EmbedProvider;
    /** The video id, or the full URL for `google-maps` and `generic`. */
    id: string;
    /** The iframe's title and the content's name: "Planting garlic". */
    title: string;
    /** Poster override; YouTube supplies one. */
    poster?: string | undefined;
    /**
     * Width over height.
     * @defaultValue `16 / 9`
     */
    aspect?: number | undefined;
    /** Start time in seconds, for a video. */
    start?: number | undefined;
    /** The origins a `generic` embed may load from (`https://example.com`). */
    allowedOrigins?: readonly string[] | undefined;
    /** Load nothing until this consent is granted; activating the button grants it. */
    consent?: EmbedConsent | undefined;
    /**
     * Load at once, with no facade, when the page exists for the embed. Never autoplays.
     * @defaultValue `false`
     */
    eager?: boolean | undefined;
    /** The link to the content on the provider's site; derived from the provider when omitted. */
    fallbackHref?: string | undefined;
    /**
     * A video's button.
     * @defaultValue `` (title) => `Play video: ${title}` ``
     */
    playLabel?: ((title: string) => string) | undefined;
    /**
     * A map's or page's button.
     * @defaultValue `` (title) => `Load ${title}` ``
     */
    loadLabel?: ((title: string) => string) | undefined;
    /**
     * The button while `consent` is not granted.
     * @defaultValue `` (provider, video) => `Allow ${provider} content and ${video ? 'play' : 'load'}` ``
     */
    allowLabel?: ((provider: string, video: boolean) => string) | undefined;
    /**
     * What loading will do, describing the button.
     * @defaultValue `` (provider) => `This will load content from ${provider}, which may set cookies.` ``
     */
    privacyNotice?: ((provider: string) => string) | undefined;
    /**
     * The fallback link's text.
     * @defaultValue `` (provider) => `Open on ${provider}` ``
     */
    linkLabel?: ((provider: string) => string) | undefined;
    /**
     * Shown when `id` is not something the provider embeds.
     * @defaultValue `'This content can’t be embedded.'`
     */
    unavailableLabel?: string | undefined;
  }

  let {
    provider,
    id,
    title,
    poster,
    aspect = 16 / 9,
    start,
    allowedOrigins,
    consent,
    eager = false,
    fallbackHref,
    playLabel = (name) => `Play video: ${name}`,
    loadLabel = (name) => `Load ${name}`,
    allowLabel = (name, video) => `Allow ${name} content and ${video ? 'play' : 'load'}`,
    privacyNotice = (name) => `This will load content from ${name}, which may set cookies.`,
    linkLabel = (name) => `Open on ${name}`,
    unavailableLabel = 'This content can’t be embedded.',
    class: className,
    ...rest
  }: Props = $props();

  const noticeId = $props.id();

  // svelte-ignore state_referenced_locally
  let activated = $state(eager && consent?.granted !== false);
  let pressed = $state(false);
  let warm = $state(false);

  const source = $derived(embedSource(provider, id, { start, allowedOrigins, autoplay: pressed }));
  const posterSrc = $derived(poster ?? source?.poster);
  const needsConsent = $derived(consent !== undefined && !consent.granted);
  const buttonLabel = $derived.by(() => {
    if (source === undefined) return '';
    if (needsConsent) return allowLabel(source.name, source.video);
    return source.video ? playLabel(title) : loadLabel(title);
  });

  const hints = $derived(warm && !activated && !needsConsent ? (source?.preconnect ?? []) : []);
  const linkHref = $derived(fallbackHref ?? source?.pageHref);
  const live = $derived(source !== undefined && activated);

  const warmUp = (): void => {
    warm = true;
  };

  const activate = async (): Promise<void> => {
    if (needsConsent) await consent?.grant();
    pressed = true;
    activated = true;
  };

  /** Move focus into the player the reader just asked for, so its controls are next. */
  const focusOnPress = (frame: HTMLIFrameElement): void => {
    if (pressed) frame.focus();
  };
</script>

<svelte:head>
  {#each hints as origin (origin)}
    <link rel="preconnect" href={origin} />
  {/each}
</svelte:head>

<figure
  {...rest}
  class={['bg-base-300 rounded-box relative overflow-hidden', className]}
  style:aspect-ratio={aspect}
>
  {#if live && source}
    <iframe
      {title}
      src={source.src}
      allow={source.allow}
      allowfullscreen
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
      class="absolute inset-0 size-full border-0"
      {@attach focusOnPress}
    ></iframe>
  {:else}
    {#if posterSrc !== undefined}
      <img src={posterSrc} alt="" loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover" />
    {/if}
    <figcaption
      class="bg-neutral/70 text-neutral-content absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center"
    >
      <span class="font-semibold">{title}</span>
      {#if source === undefined}
        <p class="text-sm">{unavailableLabel}</p>
      {:else}
        <button
          type="button"
          class="btn btn-primary"
          aria-describedby={noticeId}
          onclick={activate}
          onpointerenter={warmUp}
          onfocus={warmUp}
        >
          <Play class="size-4" aria-hidden="true" />
          {buttonLabel}
        </button>
        <p id={noticeId} class="max-w-prose text-xs">{privacyNotice(source.name)}</p>
      {/if}
      {#if linkHref !== undefined}
        <a class="link text-sm" href={linkHref}>
          {linkLabel(source?.name ?? title)}
        </a>
      {/if}
    </figcaption>
  {/if}
</figure>
