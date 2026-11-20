<!-- @component
A URL or text as an SVG QR code: one path, named by its value, with the value also as a real link (or text) so the camera is never the only way in.
-->
<!--
  The code tile is always the light theme (`data-theme="light"`): scanners
  need dark modules on a light ground, and many reject an inverted code, so
  it stays dark-on-light inside a dark page.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import VisuallyHidden from '../../ui/VisuallyHidden.svelte';
  import { atLeast, drawQr, type QrEcc } from './qr-matrix.ts';
  import QRCodeStatus from './QRCodeStatus.svelte';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** What the code encodes: a URL, a label, a Wi-Fi join string. */
    value: string;
    /**
     * Error correction; at least `'Q'` with a `logo`.
     * @defaultValue `'M'`, or `'H'` with a `logo`
     */
    ecc?: QrEcc | undefined;
    /**
     * Rendered width and height in CSS pixels; the SVG scales cleanly.
     * @defaultValue `192`
     */
    size?: number | undefined;
    /**
     * Quiet zone, in modules. Four is the minimum the standard asks for.
     * @defaultValue `4`
     */
    margin?: number | undefined;
    /** A decorative image over the centre, covering about 5% of the code. */
    logo?: { readonly src: string } | undefined;
    /**
     * The image's accessible name.
     * @defaultValue `` `QR code for ${value}` ``
     */
    label?: string | undefined;
    /**
     * Show the value under the code, for print.
     * @defaultValue `false`
     */
    showValue?: boolean | undefined;
    /**
     * Offer a button that saves the code as an SVG file.
     * @defaultValue `false`
     */
    downloadable?: boolean | undefined;
    /**
     * The download button's text.
     * @defaultValue `'Download QR code'`
     */
    downloadLabel?: string | undefined;
    /**
     * The downloaded file's name.
     * @defaultValue `'qr-code.svg'`
     */
    downloadName?: string | undefined;
    /**
     * For a code that expires, such as a sign-in handoff.
     * @defaultValue `'active'`
     */
    status?: 'active' | 'loading' | 'expired' | undefined;
    /** Called by the Refresh button on an expired code. */
    onRefresh?: (() => void) | undefined;
    /**
     * Shown over an expired code.
     * @defaultValue `'Code expired'`
     */
    expiredLabel?: string | undefined;
    /**
     * The image's name while expired.
     * @defaultValue `'Expired QR code'`
     */
    expiredImageLabel?: string | undefined;
    /**
     * The image's name while loading.
     * @defaultValue `'Loading QR code'`
     */
    loadingLabel?: string | undefined;
    /**
     * The Refresh button's text.
     * @defaultValue `'Refresh'`
     */
    refreshLabel?: string | undefined;
    /**
     * Shown in place of the code when the value is too long to encode.
     * @defaultValue `'This is too long for a QR code.'`
     */
    tooLongLabel?: string | undefined;
  }

  let {
    value,
    ecc,
    size = 192,
    margin = 4,
    logo,
    label,
    showValue = false,
    downloadable = false,
    downloadLabel = 'Download QR code',
    downloadName = 'qr-code.svg',
    status = 'active',
    onRefresh,
    expiredLabel = 'Code expired',
    expiredImageLabel = 'Expired QR code',
    loadingLabel = 'Loading QR code',
    refreshLabel = 'Refresh',
    tooLongLabel = 'This is too long for a QR code.',
    class: className,
    ...rest
  }: Props = $props();

  const level = $derived(logo === undefined ? (ecc ?? 'M') : atLeast(ecc ?? 'H', 'Q'));
  const drawing = $derived(drawQr(value, level, margin));
  const isLink = $derived(/^https?:\/\//i.test(value));
  const imageLabel = $derived.by(() => {
    if (status === 'expired') return expiredImageLabel;
    if (status === 'loading') return loadingLabel;
    return label ?? `QR code for ${value}`;
  });
  // The logo covers 22% of the side: about 5% of the area, well inside what
  // level Q recovers.
  const logoSide = $derived(drawing === undefined ? 0 : drawing.extent * 0.22);
  const logoAt = $derived(drawing === undefined ? 0 : (drawing.extent - logoSide) / 2);

  let svg = $state<SVGSVGElement | undefined>(undefined);

  /** The code as a standalone SVG file, with the tile's resolved colours written in. */
  const download = (): void => {
    if (svg === undefined) return;
    const copy = svg.cloneNode(true);
    if (!(copy instanceof SVGSVGElement)) return;
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const sourceParts = svg.querySelectorAll('rect, path');
    copy.querySelectorAll('rect, path').forEach((part, index) => {
      const source = sourceParts[index];
      if (source !== undefined) part.setAttribute('fill', getComputedStyle(source).fill);
      part.removeAttribute('class');
    });
    const url = URL.createObjectURL(new Blob([copy.outerHTML], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);
  };
</script>

<figure {...rest} class={['inline-flex flex-col items-center gap-2', className]}>
  {#if drawing === undefined}
    <p class="text-sm">{tooLongLabel}</p>
  {:else}
    <div data-theme="light" class="rounded-box relative overflow-hidden" style:width="{size}px" style:height="{size}px">
      <svg
        bind:this={svg}
        role="img"
        aria-label={imageLabel}
        data-ecc={drawing.ecc}
        viewBox="0 0 {drawing.extent} {drawing.extent}"
        width={size}
        height={size}
        shape-rendering="crispEdges"
        class={[status !== 'active' && 'blur-sm']}
      >
        <rect width={drawing.extent} height={drawing.extent} class="fill-base-100" />
        <path d={drawing.path} class="fill-base-content" />
        {#if logo !== undefined}
          <rect x={logoAt} y={logoAt} width={logoSide} height={logoSide} class="fill-base-100" />
          <image href={logo.src} x={logoAt} y={logoAt} width={logoSide} height={logoSide} />
        {/if}
      </svg>
      {#if status !== 'active'}
        <QRCodeStatus {status} {expiredLabel} {refreshLabel} {onRefresh} />
      {/if}
    </div>
  {/if}
  {#if downloadable && drawing !== undefined}
    <button type="button" class="btn btn-sm btn-ghost" onclick={download}>{downloadLabel}</button>
  {/if}
  {#if showValue}
    <figcaption class="text-sm break-all">
      {#if isLink}<a class="link" href={value}>{value}</a>{:else}{value}{/if}
    </figcaption>
  {:else if isLink}
    <VisuallyHidden><a href={value}>{value}</a></VisuallyHidden>
  {/if}
</figure>
