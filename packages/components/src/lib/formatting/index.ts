/**
 * formatting — locale-aware rendering of dates, numbers, lists and search
 * highlights. See the package README for the family reference.
 *
 * @module
 */

export { default as DateTime } from './DateTime.svelte';
// `NumberFormat`, not `Number`: a named export called `Number` would shadow
// the global constructor for anyone importing it by that name.
export { default as NumberFormat } from './Number.svelte';
export { default as FormatList } from './FormatList.svelte';
export { default as RelativeTime } from './RelativeTime.svelte';
export { default as Year } from './Year.svelte';
export { default as Highlight, tokenise } from './Highlight.svelte';
