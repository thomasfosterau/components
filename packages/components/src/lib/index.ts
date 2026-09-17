/**
 * Accessible Svelte 5 UI primitives.
 *
 * Everything exported here is app-agnostic: it takes props and snippets,
 * spreads the native attributes of the element it renders, and reads no
 * global state. Styling is daisyUI semantic classes over the tokens in
 * `./theme.css`, which ships beside this barrel as the package's
 * `./theme.css` export.
 *
 * @module @thomasfosterau/components
 */

export { default as VisuallyHidden } from './ui/VisuallyHidden.svelte';
