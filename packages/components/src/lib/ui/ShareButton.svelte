<!-- @component
Hands a title, a URL and some text to the platform share sheet.
-->
<!--
  ShareButton — hands a title, a URL and some text to the platform share
  sheet.

  It renders NOTHING where the Web Share API is absent — every desktop
  Firefox, and the server. A button that opens nothing is worse than no
  button, and the caller cannot know which it has before hydration, so the
  decision is made here and made after mount: reading `navigator.share` during
  SSR would render a button the client then has to remove, which is a layout
  shift on every page that carries one.

  `canShare`, where the browser has it, is consulted with the SAME payload
  that will be shared — the original in-the-dark implementation tested one
  object and shared another. Where it is missing the only way to find out is
  to try, and the rejection path handles "no". A share sheet the reader
  dismisses also rejects; `onError` sees both, because the API does not
  distinguish them.

  ARIA contract: a plain `Button`, so nothing beyond its label. The icon is
  decorative.
-->
<script lang="ts">
  import { Share2 } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';
  import type { ButtonVariant, Size, Tone } from './tones.ts';

  interface Props {
    /** Share sheet title. */
    title?: string | undefined;
    /** Body text offered alongside the link. */
    text?: string | undefined;
    /** The URL to share; the current page when omitted. */
    url?: string | undefined;
    /**
     * The button's text.
     * @defaultValue `'Share'`
     */
    label?: string | undefined;
    /** Semantic colour. */
    tone?: Tone | undefined;
    /**
     * daisyUI button style.
     * @defaultValue `'ghost'`
     */
    variant?: ButtonVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'sm'`
     */
    size?: Size | undefined;
    /** Extra classes, merged last. */
    class?: string | undefined;
    /** The share sheet completed. */
    onShare?: ((data: ShareData) => void) | undefined;
    /** The share sheet failed, or the reader dismissed it. */
    onError?: ((error: unknown) => void) | undefined;
    /** Replaces the label and icon entirely. */
    children?: Snippet<[]> | undefined;
  }

  let {
    title,
    text,
    url,
    label = 'Share',
    tone,
    variant = 'ghost',
    size = 'sm',
    class: className,
    onShare,
    onError,
    children,
  }: Props = $props();

  /**
   * Whether this browser can share at all. Set from an effect, never at
   * module or render scope: `navigator` does not exist on the server.
   */
  let shareable = $state(false);
  $effect(() => {
    shareable = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  });

  const payload = $derived<ShareData>({
    ...(title === undefined ? {} : { title }),
    ...(text === undefined ? {} : { text }),
    ...(url === undefined ? {} : { url }),
  });

  const share = async (): Promise<void> => {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
      onError?.(new Error('This browser cannot share that payload.'));
      return;
    }
    try {
      await navigator.share(payload);
      onShare?.(payload);
    } catch (error) {
      onError?.(error);
    }
  };
</script>

{#if shareable}
  <Button {tone} {variant} {size} class={className} onclick={share}>
    {#if children}
      {@render children()}
    {:else}
      <Share2 class="size-4" aria-hidden="true" />
      {label}
    {/if}
  </Button>
{/if}
