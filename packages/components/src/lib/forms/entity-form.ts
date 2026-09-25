/**
 * `@thomasfosterau/components/entity-form` — the renderer for
 * `@thomasfosterau/effect-forms-svelte`'s `defineEntityForm` definitions.
 *
 * A separate entry point, and the only one that reaches Effect:
 * `@thomasfosterau/effect-forms-svelte` (and, through it, `effect`) is an
 * OPTIONAL peer of this package, needed exactly when this entry is imported.
 * Deliberately NOT re-exported from the `forms` family or the root barrel.
 *
 * @module
 */

export { default as EntityForm } from './EntityForm.svelte';
