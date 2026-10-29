/**
 * data — the tables, lists and pagers an index page and a detail page are
 * built from.
 *
 * Two shapes of list run through this family, and the split is worth stating
 * once. `Table` and `ItemList` present a window a caller already chose:
 * they never decide which rows exist, so they serve a server-paged collection
 * of 40,000 as happily as a list of four. `DataGrid` is the other shape —
 * it sorts, filters and pages a bounded set the page already holds, entirely
 * on the client — and it composes the first two rather than duplicating them.
 *
 * Every optional prop in this family is declared `T | undefined`, not bare
 * `T`: the workspace compiles with `exactOptionalPropertyTypes`, under which
 * `prop?: T` rejects an explicitly passed `undefined`, and a caller
 * forwarding its own optional prop straight through would not compile.
 *
 * @module
 */

export { default as ChatBubble } from './ChatBubble.svelte';
export { default as DataGrid } from './DataGrid.svelte';
export { default as DescriptionList } from './DescriptionList.svelte';
export { default as DescriptionRow } from './DescriptionRow.svelte';
export { default as DiffText } from './DiffText.svelte';
export { default as ItemList } from './ItemList.svelte';
export { default as LinkListItem } from './LinkListItem.svelte';
export { default as MessageThread } from './MessageThread.svelte';
export { default as Pagination } from './Pagination.svelte';
export { default as PaginationFooter } from './PaginationFooter.svelte';
export { default as ResultCount } from './ResultCount.svelte';
export { default as Table } from './Table.svelte';
export { default as TreeList } from './TreeList.svelte';
export { default as TreeListItem } from './TreeListItem.svelte';

export * from './description-context.ts';
export * from './diff.ts';
export * from './list-item.ts';
export * from './pagination.ts';
export * from './table-types.ts';
