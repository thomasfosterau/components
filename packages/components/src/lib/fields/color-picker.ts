/**
 * `@thomasfosterau/components/color-picker` — `ColorPicker`, kept out of the
 * root barrel so its colour maths and custom editor load only where used.
 * The swatch palette alone, `ColorSwatchGroup`, is in the root barrel.
 *
 * @module
 */

export { default as ColorPicker } from './ColorPicker.svelte';
export type { ColorFormat } from './color.ts';
