/**
 * Accessible Svelte 5 UI primitives.
 *
 * Everything exported here is app-agnostic: it takes props and snippets,
 * spreads the native attributes of the element it renders, reads no global
 * state, and gets every user-facing string from a prop with an English
 * default. Styling is daisyUI semantic classes over the tokens in
 * `./theme.css`, which ships beside this barrel as the package's
 * `./theme.css` export. The one injected dependency is
 * {@link ComponentsContext}: locale, href resolution, navigation and the
 * current-page check.
 *
 * The heavier families — `citations`, `maps`, `canvas`, `charts`, `tips` —
 * are separate entry points (`@thomasfosterau/components/<family>`), not
 * re-exported here.
 *
 * @module @thomasfosterau/components
 */

export * from './context.svelte.ts';
export * from './ui/index.ts';
export * from './feedback/index.ts';
export * from './layout/index.ts';
export * from './fields/index.ts';
export * from './forms/index.ts';
export * from './data/index.ts';
export * from './infobox/index.ts';
export * from './formatting/index.ts';
export * from './links/index.ts';
export * from './media/index.ts';
export * from './hotkeys/index.ts';
export * from './search/index.ts';
