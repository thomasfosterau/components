<!-- @component
A person's or entity's picture in daisyUI's `avatar` frame, with an initials (or icon) fallback while it loads and when it fails.
-->
<!--
  Avatar — a picture of a person or thing (a gardener, an organisation) in a
  round or rounded frame. While the image loads, and when it fails (a
  deleted upload, an expired signed URL), the frame shows initials derived
  from `name`, or the `fallback` snippet — never the browser's broken-image
  glyph.

  The load state is hand-rolled (an `<img>` with `load` / `error` handlers,
  plus a `complete` check for an image that finished before hydration)
  rather than bits-ui's `Avatar`: it is a dozen lines, and it keeps bits-ui
  off the root barrel's always-loaded path for a component that has no
  interaction at all.

  ARIA contract — the rule that the common avatar bugs break:
  - **Named** (`name` given): the frame is `role="img"` named by `name`, plus
    the presence text when there is one ("Ada Lovelace, Online"). The inner
    `<img alt="">` and the initials are hidden, so the name is announced
    once whichever of image or fallback is showing.
  - **Decorative** (no `name`): the whole avatar is `aria-hidden`. Use this
    where the name is already adjacent in text (a byline), so it is not read
    twice (WCAG technique H67).
  - Presence is never colour alone: the ring is decorative, and
    `onlineLabel` / `offlineLabel` is part of the name.

  `shape` also takes daisyUI's mask shapes (`MaskShape`: squircle, hexagon,
  star…). The mask goes on the INNER picture frame only, never on the outer
  element: a mask clips everything outside the shape, a focus outline
  included, so it must never sit on (or around) anything focusable — wrap a
  masked avatar in a link or button, never the other way round. `'circle'`
  stays the plain `rounded-full` frame; a mask is purely visual and changes
  no role, name or state.
-->
<script module lang="ts">
  import { avatarShape, maskShape, type AvatarShape, type MaskShape } from './tones.ts';

  /** Every `shape` an Avatar takes: its own radii, then the masks (`circle` stays the radius). */
  const frameShape: Record<AvatarShape | MaskShape, string> = { ...maskShape, ...avatarShape };
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { initialsOf } from './avatar.ts';
  import { avatarSize, type Size } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
    /** The image URL. Omitted or failing, the fallback shows. */
    src?: string | undefined;
    /** Who or what is pictured; the accessible name. Omit when the name is adjacent text. */
    name?: string | undefined;
    /** Overrides the initials derived from `name`. */
    initials?: string | undefined;
    /**
     * Size step.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * Frame shape: a radius (`'circle'`, `'rounded'`, `'square'`) or a daisyUI mask (`'squircle'`, `'hexagon'`, …).
     * @defaultValue `'circle'`
     */
    shape?: AvatarShape | MaskShape | undefined;
    /** A presence ring (daisyUI `avatar-online` / `avatar-offline`), named in words too. */
    presence?: 'online' | 'offline' | undefined;
    /**
     * Read after the name when `presence` is `'online'`.
     * @defaultValue `'Online'`
     */
    onlineLabel?: string | undefined;
    /**
     * Read after the name when `presence` is `'offline'`.
     * @defaultValue `'Offline'`
     */
    offlineLabel?: string | undefined;
    /**
     * Milliseconds before the fallback shows while the image loads, so a fast load does not flash initials.
     * @defaultValue `0`
     */
    delayMs?: number | undefined;
    /** A custom fallback (an icon) in place of the initials. */
    fallback?: Snippet<[]> | undefined;
  }

  let {
    src,
    name,
    initials,
    size = 'md',
    shape = 'circle',
    presence,
    onlineLabel = 'Online',
    offlineLabel = 'Offline',
    delayMs = 0,
    fallback,
    class: className,
    ...rest
  }: Props = $props();

  let status = $state<'loading' | 'loaded' | 'error'>('loading');
  let delayElapsed = $state(false);
  let image: HTMLImageElement | null | undefined = $state();

  // A new `src` starts loading again; the fallback waits `delayMs` first.
  $effect(() => {
    if (src === undefined) return;
    status = 'loading';
    delayElapsed = delayMs <= 0;
    if (delayMs <= 0) return;
    const timer = setTimeout(() => {
      delayElapsed = true;
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  });

  // An image that finished before hydration fired its event too early to hear.
  $effect(() => {
    if (image === undefined || image === null || !image.complete) return;
    status = image.naturalWidth > 0 ? 'loaded' : 'error';
  });

  const showImage = $derived(src !== undefined && status !== 'error');
  const showFallback = $derived(
    src === undefined || status === 'error' || (status === 'loading' && delayElapsed),
  );
  const letters = $derived(initials ?? (name === undefined ? '' : initialsOf(name)));
  const presenceText = $derived(
    presence === 'online' ? onlineLabel : presence === 'offline' ? offlineLabel : undefined,
  );
  const accessibleName = $derived(
    name === undefined ? undefined : [name, presenceText].filter(Boolean).join(', '),
  );
</script>

<span
  {...rest}
  role={accessibleName === undefined ? undefined : 'img'}
  aria-label={accessibleName}
  aria-hidden={accessibleName === undefined ? 'true' : undefined}
  class={[
    'avatar',
    showFallback && !showImage && 'avatar-placeholder',
    presence === 'online' && 'avatar-online',
    presence === 'offline' && 'avatar-offline',
    className,
  ]}
>
  <span
    class={[
      'relative inline-flex items-center justify-center overflow-hidden',
      avatarSize[size],
      frameShape[shape],
      (showFallback || !showImage) && 'bg-neutral text-neutral-content',
    ]}
  >
    {#if showImage}
      <img
        bind:this={image}
        {src}
        alt=""
        class={status === 'loaded' ? 'size-full object-cover' : 'absolute size-0 opacity-0'}
        onload={() => {
          status = 'loaded';
        }}
        onerror={() => {
          status = 'error';
        }}
      />
    {/if}
    {#if showFallback && status !== 'loaded'}
      <span aria-hidden="true" class="inline-flex items-center justify-center">
        {#if fallback}{@render fallback()}{:else}{letters}{/if}
      </span>
    {/if}
  </span>
</span>
