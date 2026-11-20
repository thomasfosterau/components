<!-- @component
An audio player over a native `<audio>`: play/pause, seek with elapsed and remaining time, ±skip, playback speed, mute and volume, an optional transcript, and Media Session metadata for the lock screen.
-->
<!--
  AudioPlayer — themed controls over a native element, so the browser keeps
  media keys, lock-screen controls and AirPlay. Play and mute are toggle
  buttons with constant names and `aria-pressed`. The seek slider's
  `aria-valuetext` is the long form ("1 minute, 5 seconds of 3 minutes") and
  only changes on interaction and pause, so a screen reader isn't fed every
  `timeupdate`. Shortcuts (Space/K, J/L, M) act only while focus is inside.
-->
<script lang="ts">
  import { Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import Slider from '../fields/Slider.svelte';
  import Disclosure from '../ui/Disclosure.svelte';
  import IconButton from '../ui/IconButton.svelte';
  import ToggleButton from '../ui/ToggleButton.svelte';
  import AudioPlayerTitle from './AudioPlayerTitle.svelte';
  import { clampTime, formatClock, spokenTime } from './audio-time.ts';

  /** One source of several, for the browser to pick by type. */
  export interface AudioSource {
    readonly src: string;
    readonly type: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** The audio URL, or sources in order of preference. */
    src: string | readonly AudioSource[];
    /** Visible title; also the player's accessible name and the Media Session title. */
    title: string;
    /** Who made it, shown under the title and on the lock screen. */
    artist?: string | undefined;
    /** Cover image URL. */
    artwork?: string | undefined;
    /** A WebVTT captions track URL. */
    captions?: string | undefined;
    /** A text alternative, in a disclosure under the player (WCAG 1.2.1 asks for one). */
    transcript?: Snippet<[]> | undefined;
    /**
     * What to load before play.
     * @defaultValue `'metadata'`
     */
    preload?: 'none' | 'metadata' | 'auto' | undefined;
    /**
     * Playback speeds offered.
     * @defaultValue `[0.75, 1, 1.25, 1.5, 2]`
     */
    rates?: readonly number[] | undefined;
    /**
     * Seconds the skip buttons and J/L move; `0` hides the buttons.
     * @defaultValue `15`
     */
    skip?: number | undefined;
    /**
     * Playback position in seconds. Bindable.
     * @defaultValue `0`
     */
    currentTime?: number | undefined;
    /**
     * Whether playback is paused. Bindable; set it to `false` to play.
     * @defaultValue `true`
     */
    paused?: boolean | undefined;
    /**
     * Publish the title, artist and artwork to the Media Session while playing.
     * @defaultValue `true`
     */
    mediaSession?: boolean | undefined;
    /**
     * One row, without artwork, skip buttons or the volume slider.
     * @defaultValue `false`
     */
    compact?: boolean | undefined;
    /**
     * The play button's name; it stays the same while playing and `aria-pressed` says so.
     * @defaultValue `'Play'`
     */
    playLabel?: string | undefined;
    /**
     * The seek slider's name.
     * @defaultValue `'Seek'`
     */
    seekLabel?: string | undefined;
    /**
     * The mute button's name.
     * @defaultValue `'Mute'`
     */
    muteLabel?: string | undefined;
    /**
     * The volume slider's name.
     * @defaultValue `'Volume'`
     */
    volumeLabel?: string | undefined;
    /**
     * The speed menu's name.
     * @defaultValue `'Playback speed'`
     */
    rateLabel?: string | undefined;
    /**
     * The back button's name.
     * @defaultValue `` (s) => `Back ${s} seconds` ``
     */
    skipBackLabel?: ((seconds: number) => string) | undefined;
    /**
     * The forward button's name.
     * @defaultValue `` (s) => `Forward ${s} seconds` ``
     */
    skipForwardLabel?: ((seconds: number) => string) | undefined;
    /**
     * The transcript disclosure's summary.
     * @defaultValue `'Transcript'`
     */
    transcriptLabel?: string | undefined;
    /**
     * The seek slider's spoken position, from the long-form elapsed and total times.
     * @defaultValue `` (elapsed, total) => `${elapsed} of ${total}` ``
     */
    positionLabel?: ((elapsed: string, total: string) => string) | undefined;
    /**
     * The on-screen clock.
     * @defaultValue `m:ss`, or `h:mm:ss` from an hour
     */
    formatTime?: ((seconds: number) => string) | undefined;
    /**
     * A speed option's text.
     * @defaultValue `` (rate) => `${rate}×` `` in `locales`
     */
    formatRate?: ((rate: number) => string) | undefined;
    /** BCP 47 locale(s) for the spoken times and speeds; falls back to the context's `locale()`. */
    locales?: string | readonly string[] | undefined;
  }

  let {
    src,
    title,
    artist,
    artwork,
    captions,
    transcript,
    preload = 'metadata',
    rates = [0.75, 1, 1.25, 1.5, 2],
    skip = 15,
    currentTime = $bindable(0),
    paused = $bindable(true),
    mediaSession = true,
    compact = false,
    playLabel = 'Play',
    seekLabel = 'Seek',
    muteLabel = 'Mute',
    volumeLabel = 'Volume',
    rateLabel = 'Playback speed',
    skipBackLabel = (seconds: number) => `Back ${seconds} seconds`,
    skipForwardLabel = (seconds: number) => `Forward ${seconds} seconds`,
    transcriptLabel = 'Transcript',
    positionLabel = (elapsed: string, total: string) => `${elapsed} of ${total}`,
    formatTime = formatClock,
    formatRate,
    locales = getComponentsContext().locale(),
    class: className,
    ...rest
  }: Props = $props();

  let duration = $state(Number.NaN);
  let muted = $state(false);
  let volume = $state(1);
  let playbackRate = $state(1);
  /** Whether `volume` can be set: iOS keeps it read-only, at 1. */
  let volumeSettable = $state(false);

  const showSkip = $derived(!compact && skip > 0);
  const showVolume = $derived(!compact && volumeSettable);
  const sources = $derived(typeof src === 'string' ? [{ src, type: '' }] : src);
  const rateText = $derived(
    formatRate ?? ((rate: number) => `${new Intl.NumberFormat(locales as string[]).format(rate)}×`),
  );
  const spokenPosition = (time: number): string =>
    positionLabel(spokenTime(time, locales), spokenTime(duration, locales));

  /** The seek slider's `aria-valuetext`, refreshed only on interaction, pause and load. */
  let announced = $state('');
  const announce = (): void => {
    announced = spokenPosition(currentTime);
  };
  $effect(() => {
    if (paused) announce();
  });

  const seek = (time: number): void => {
    currentTime = clampTime(time, duration);
    announce();
  };
  /**
   * The slider snaps to whole seconds and writes its snapped value back as
   * playback moves; only a change bigger than that rounding is a seek.
   */
  const seekFromSlider = (time: number | undefined): void => {
    if (time !== undefined && Math.abs(time - currentTime) > 0.5) seek(time);
  };
  const toggle = (): void => {
    paused = !paused;
  };
  const back = (): void => seek(currentTime - skip);
  const forward = (): void => seek(currentTime + skip);
  const toggleMute = (): void => {
    muted = !muted;
  };

  const SHORTCUTS: Readonly<Record<string, () => void>> = {
    ' ': toggle,
    k: toggle,
    j: back,
    l: forward,
    m: toggleMute,
  };
  /** Targets that own a key: Space presses a button, letters type into a field or pick an option. */
  const ownsKey = (target: EventTarget | null, key: string): boolean =>
    target instanceof Element &&
    (target.matches('input, select, textarea') ||
      (key === ' ' && target.matches('button, summary')));

  const onKeydown = (event: KeyboardEvent): void => {
    const action = SHORTCUTS[event.key.toLowerCase()];
    if (!action || event.ctrlKey || event.metaKey || event.altKey) return;
    if (ownsKey(event.target, event.key)) return;
    event.preventDefault();
    action();
  };

  /** Arrows on the seek thumb move five seconds rather than one step. */
  const onSeekKeydown = (event: KeyboardEvent): void => {
    const delta = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    seek(currentTime + delta);
  };

  $effect(() => {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeSettable = probe.volume === 0.5;
  });

  $effect(() => {
    if (!mediaSession || paused || !('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    session.metadata = new MediaMetadata({
      title,
      ...(artist === undefined ? {} : { artist }),
      ...(artwork === undefined ? {} : { artwork: [{ src: artwork }] }),
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => (paused = false)],
      ['pause', () => (paused = true)],
      ['seekbackward', back],
      ['seekforward', forward],
      ['seekto', (details) => seek(details.seekTime ?? currentTime)],
    ];
    for (const [action, handler] of handlers) session.setActionHandler(action, handler);
    return () => {
      session.metadata = null;
      for (const [action] of handlers) session.setActionHandler(action, null);
    };
  });
</script>

{#snippet playIcon()}<Play class="size-5" />{/snippet}
{#snippet pauseIcon()}<Pause class="size-5" />{/snippet}
{#snippet backIcon()}<RotateCcw class="size-4" />{/snippet}
{#snippet forwardIcon()}<RotateCw class="size-4" />{/snippet}
{#snippet soundIcon()}<Volume2 class="size-4" />{/snippet}
{#snippet mutedIcon()}<VolumeX class="size-4" />{/snippet}

<div {...rest} role="group" aria-label={title} class={['bg-base-200 rounded-box flex flex-col gap-2 p-3', className]}>
  <!-- svelte-ignore a11y_media_has_caption -->
  <audio
    bind:currentTime
    bind:paused
    bind:duration
    bind:muted
    bind:volume
    bind:playbackRate
    {preload}
    onloadedmetadata={announce}
  >
    {#each sources as source (source.src)}
      <source src={source.src} type={source.type || undefined} />
    {/each}
    {#if captions !== undefined}
      <track kind="captions" src={captions} />
    {/if}
  </audio>

  {#if !compact}
    <AudioPlayerTitle {title} {artist} {artwork} />
  {/if}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="flex flex-wrap items-center gap-2" onkeydown={onKeydown}>
    {#if showSkip}
      <IconButton label={skipBackLabel(skip)} icon={backIcon} size="sm" onclick={back} />
    {/if}
    <ToggleButton
      iconOnly
      label={playLabel}
      icon={playIcon}
      pressedIcon={pauseIcon}
      pressed={!paused}
      onPressedChange={(playing) => (paused = !playing)}
      tone="primary"
      variant="soft"
    />
    {#if showSkip}
      <IconButton label={skipForwardLabel(skip)} icon={forwardIcon} size="sm" onclick={forward} />
    {/if}
    <span class="text-sm tabular-nums" aria-hidden="true">{formatTime(currentTime)}</span>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span class="min-w-24 flex-1" onkeydowncapture={onSeekKeydown}>
      <Slider
        label={seekLabel}
        min={0}
        max={Number.isFinite(duration) ? duration : 0}
        step={1}
        bind:value={() => currentTime, seekFromSlider}
        formatValue={() => announced}
        showValue={false}
        disabled={!Number.isFinite(duration)}
        size="sm"
      />
    </span>
    <span class="text-sm tabular-nums" aria-hidden="true">
      -{formatTime(Number.isFinite(duration) ? duration - currentTime : 0)}
    </span>
    <select class="select select-sm w-auto" aria-label={rateLabel} bind:value={playbackRate}>
      {#each rates as rate (rate)}
        <option value={rate}>{rateText(rate)}</option>
      {/each}
    </select>
    <ToggleButton
      iconOnly
      label={muteLabel}
      icon={soundIcon}
      pressedIcon={mutedIcon}
      bind:pressed={muted}
      size="sm"
    />
    {#if showVolume}
      <span class="w-24">
        <Slider
          label={volumeLabel}
          min={0}
          max={100}
          bind:value={() => Math.round(volume * 100), (next) => (volume = next / 100)}
          formatValue={(percent) => `${percent}%`}
          showValue={false}
          size="xs"
        />
      </span>
    {/if}
  </div>

  {#if transcript !== undefined}
    <Disclosure title={transcriptLabel}>
      {@render transcript()}
    </Disclosure>
  {/if}
</div>
