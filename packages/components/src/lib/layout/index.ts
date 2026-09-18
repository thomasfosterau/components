/**
 * layout — page chrome: the landmarks a page is assembled from, and the
 * blocks that sit inside them.
 *
 * The family is structure, never copy. Every one of these takes the app's
 * content as snippets and owns only the element that carries the semantics —
 * the `<main>` a reader jumps to, the named `<nav>`s, the `banner` and
 * `contentinfo` at the two ends of the page, the `<section aria-labelledby>`
 * a long page is cut into. Import from the package barrel rather than from
 * here.
 *
 * Optional props are declared `T | undefined` for the reason `ui/`'s are: the
 * workspace compiles with `exactOptionalPropertyTypes`, under which `prop?: T`
 * rejects an explicitly passed `undefined` and a caller cannot forward its own
 * optional prop straight through.
 *
 * @module
 */

export { default as Breadcrumbs } from './Breadcrumbs.svelte';
export { default as DetailLayout } from './DetailLayout.svelte';
export { default as FilterBar } from './FilterBar.svelte';
export { default as Footer } from './Footer.svelte';
export { default as Main } from './Main.svelte';
export { default as Navbar } from './Navbar.svelte';
export { default as PageHeader } from './PageHeader.svelte';
export { default as Section } from './Section.svelte';
export { default as Sidebar } from './Sidebar.svelte';
export { default as Tabs } from './Tabs.svelte';

export * from './types.ts';
