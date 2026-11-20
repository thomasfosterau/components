/**
 * The `@thomasfosterau/components/qr` entry: `QRCode` and the encoder it
 * draws with, kept off the root barrel because the encoder is large.
 *
 * @module
 */

export { default as QRCode } from './QRCode.svelte';
export { atLeast, drawQr, type QrDrawing, type QrEcc } from './qr-matrix.ts';
