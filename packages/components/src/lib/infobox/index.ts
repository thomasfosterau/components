/**
 * infobox — the family that fills an entity page's summary rail, two ways
 * at once.
 *
 * Composed primitives (`InfoboxHeader`, `InfoboxImage`, `InfoboxSection`,
 * `InfoboxRow`) let a page build bespoke markup, gardeneria's style. A
 * typed `rows` convenience on `Infobox` itself — the `InfoboxRowSpec` union
 * and `infoboxRowIsPresent` — lets a page instead hand over a
 * `$derived<InfoboxRowSpec[]>` built from sparse entity attributes,
 * website's and preferenceflow's style; `rows` renders through the very
 * same primitives, so a fix to row layout lands in one place regardless of
 * which API a caller used to reach it.
 *
 * @module
 */

export { default as Infobox } from './Infobox.svelte';
export { default as InfoboxHeader } from './InfoboxHeader.svelte';
export { default as InfoboxImage } from './InfoboxImage.svelte';
export { default as InfoboxRow } from './InfoboxRow.svelte';
export { default as InfoboxSection } from './InfoboxSection.svelte';
export { infoboxRowIsPresent } from './types.ts';
export type {
  InfoboxCustomRow,
  InfoboxFactRow,
  InfoboxImageRow,
  InfoboxImageSpec,
  InfoboxLinkEntry,
  InfoboxLinkRow,
  InfoboxLinksRow,
  InfoboxRowSpec,
} from './types.ts';
