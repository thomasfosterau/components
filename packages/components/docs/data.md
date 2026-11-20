# Data: tables, grids, lists and pagers

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

The tables, lists and pagers an index page and a detail page are built from. Two shapes run through it: **`Table` and `ItemList` present a window the caller already chose** (they never decide which rows exist, so a server-paged 40,000 rows is as easy as four). **`DataGrid` sorts, filters and pages a bounded set the page already holds, on the client**, composing the other two rather than duplicating them. **`VirtualList` holds the whole of a long list and mounts only the window being read.**

**Editing a `DataGrid`.** `editing="cell"` or `"batch"` turns the table into an APG Grid (`role="grid"`, `aria-rowcount` / `aria-colcount`, `gridcell`s, `aria-readonly` on cells the reader cannot edit, `aria-selected` rows under a selection mode); a non-editing `DataGrid` and every `Table` stay a plain `<table>`. A column opts in with `editable` (`true`, or per row) and names its `editor`: `'text'` (`TextInput`, the default), `'number'` (`NumberField`), `'select'` (`Select`, from `options`), `'date'` (`DateField`), `'checkbox'` (`Checkbox`, always in the cell: Space toggles and commits) or a snippet taking a `CellEditorContext` (`{ value, row, update, commit, cancel, control }` — spread `control`, the `FieldControl`, on your control). `editValue(row)` is the raw value an editor starts from when `value` is display text (a `boolean`, a `DateValue`); `validate(value, row)` returns messages; `parse(text)` / `format(value)` convert a text editor's text and show an edited value. The grid is one Tab stop: arrows, Home/End, Ctrl/⌘+Home/End and Page Up/Down move between cells (the header row included); Enter or F2 edits, typing a character starts editing with it, Alt+↓ opens a select; in the editor Enter commits and moves down, Tab / Shift+Tab commit and move on, Escape cancels, and focus returns to the grid. A value that fails `validate` is not committed. Cells in error — failed validations, data that arrives invalid and rejected saves — are `aria-invalid`, described by their message and marked with an icon, counted in a `role="status"` line above the grid and listed as buttons that focus the cell (onto its page, past the filter). `'cell'` hands each commit to `onCellCommit({ rowKey, column, row, from, to }, signal)` and shows it `aria-busy` until it settles — resolve once your `rows` hold the new value, reject with an `Error` to roll back and announce it. `'batch'` collects one `CellChange` per cell in the bindable `changes` (an edit back to the original drops out), marks each changed cell with a dot and the description `changedLabel`, and leaves saving — and emptying `changes` — to you. Every editing grid keeps an undo history (`undo`, default `true`): with a cell focused, not open, Ctrl/⌘+Z undoes the last committed edit and Ctrl/⌘+Shift+Z or Ctrl+Y redoes it, focus moves to that cell and `undoneLabel` / `redoneLabel` is announced ("Undid Count for Basil"). In `'batch'` an undo puts the cell's previous value back into `changes`, so undoing a cell's only edit drops it from the list; in `'cell'` it is one more `onCellCommit` from the saved value back to the earlier one, busy and rolled back like any other (a rejected undo stays undoable, and an edit whose save was rejected never enters the history). In an open editor those keys are the control's own. The history holds 100 steps and is dropped once a row it names leaves `rows`. A `cell` snippet with its own link adds a Tab stop the grid does not manage, so give an editing grid plain cells; `onSelect` does not apply to one.

**A large import: `virtual`.** An editing grid pages by default; `virtual` windows it instead, for the thousands of rows an import review holds. The whole sorted, filtered result becomes one scrolling grid at most `viewportHeight` tall (`'32rem'`), with the header row pinned, and only the rows in view plus a few either side are in the DOM — drawn with `VirtualList`'s own windowing between two `aria-hidden` spacer rows. `aria-rowcount` still counts the whole result and every row's `aria-rowindex` is its place in it, so "row 4,201 of 5,001" is announced with thirty rows mounted. Rows are a fixed `rowHeight` (by `size`: 36, 40, 48, 64 or 76 px) and do not wrap, so choose one that fits a row with its editor open. Every move reaches every row: the arrows, Page Up / Page Down (a viewport of rows), Ctrl/⌘+Home / End, a commit's move down or across, and the error summary's buttons each scroll the target row into the window before focusing its cell. The row holding focus — the active cell, or an open editor — stays mounted however far the reader scrolls, until focus leaves it. `paginated` and the pager do not apply; `virtual` is ignored while `editing` is `'none'` (a long read-only list is a `VirtualList`), and the trade-off of windowing above applies: find-in-page and browse mode reach only the mounted rows, so offer `filterable`.

```svelte
<DataGrid rows={imported} {columns} rowKey={(row) => row.line} caption="Imported contacts" editing="batch" virtual bind:changes filterable />
```

**A settings screen: `ListGroup` and `ListRow`.** A `ListGroup` is an inset, rounded group of rows under a heading (a `region` named by it), and a `ListRow` is one row: `leading`, `overline` / `headline` / `supporting`, `trailing`. A row with `href` is one link and with `onclick` one button, named by the headline and the trailing value ("Units Metric"); any other row is a control row, whose `trailing` snippet gets `{ labelledBy, describedBy }` so the switch or select in it is named after the row, and a click on the row's text works the control. Pass a bare control (`<input type="checkbox" role="switch" class="toggle" aria-labelledby={labelledBy}>`, a `<select>`) rather than a field with its own visible label. An expander row is a control row whose `children` hold a `Disclosure`. A link or button row must not hold a focusable element in `trailing` (interactive elements can't nest); in development it logs a console warning if it does. `LinkListItem` is a preset over `ListRow`.

**Tasks in any order: `TaskList`.** `TaskList` takes `sections` of `Task`s (`{ id, title, href?, hint?, status }`), each section a heading at `level` and a `<ul>`, under a "You have completed 2 of 5 tasks" summary and progress bar (`summary`, `summaryLabel`, `progressLabel`). A task's title is its row's one link, stretched over the row and described by its hint and its status tag, so it reads "Add beds, link, Completed"; `'cannot-start'` renders the title as text. Status is always text (`statusLabels` overrides the English defaults), and "Completed" is the quietest tag. Choose `Steps` for one flow in a fixed order, and `TaskList` when tasks can be done in any order, some are blocked, and readers come back to them. `TaskListItem` is one row, for a list you lay out yourself.

**Comparing two texts: `DiffText` or `DiffView`.** `DiffText` renders word runs you already have, inline, for a sentence or a short field. `DiffView` takes `before` and `after` strings and diffs them itself, line by line (Myers' algorithm; CRLF and LF compare equal, a missing final line break does not), as a `<table>` captioned by `summaryLabel` ("2 lines added, 1 removed"): `layout="unified"` (one column), `"split"` (side by side, a change's nth removed line beside its nth added one) or `"auto"` (split from `md` up). A changed line starts with a visually hidden `addedLabel` / `removedLabel`, and with `wordDiff` (default) a paired line marks its changed words in `<ins>` / `<del>`. Unchanged runs longer than `context` lines (3) either side of a change collapse behind a button (`expandLabel`), which focuses the first line it reveals. `mono` is for code and data. The pure functions under it are exported too: `diffLines(before, after, { wordDiff })`, `diffBlocks(lines, context)`, `splitRows(lines)`, `diffWords(before, after)` and the generic `diffSequences(a, b)`.

```svelte
<ListGroup title="Notifications">
  <ListRow headline="Email digests" supporting="A summary every Monday.">
    {#snippet trailing({ labelledBy, describedBy })}
      <input type="checkbox" role="switch" class="toggle" bind:checked={digests} aria-labelledby={labelledBy} aria-describedby={describedBy} />
    {/snippet}
  </ListRow>
  <ListRow headline="Units" href="/settings/units">{#snippet trailing()}Metric{/snippet}</ListRow>
</ListGroup>
```

**`TreeList` or `TreeView`?** Can the reader select a node, or does the tree run past a few dozen nodes? `TreeView`. A hierarchy that is only read, with links or rich content in its rows, is a `TreeList` (a native `<details>` disclosure, one Tab stop per node). `TreeView` is data-driven: a `TreeNode<T>` is `{ id, label, children?, disabled?, data? }` — `children` absent is a leaf, and `children: []` with `loadChildren` is a parent still to load, fetched once on first expand with an `AbortSignal` that aborts if it collapses first. `expanded` and `selected` are mutated in place, so bind them or hold the same `SvelteSet`. Activate a navigation tree's nodes with `onActivate` and the context's `navigate()` rather than links inside rows.

**Structured data: `JsonView`.** `JsonView` shows any JSON-compatible `value` (an API response, a GeoJSON feature's properties, an imported row, a chart spec) as a read-only `TreeView`, with node ids that are JSONPaths (`$.beds[2].name`). Each node is named as it reads ("count: 12, number", "beds, array, 4 items"), the type word carrying what the colour shows. Levels expand to `expandDepth` (1), the filter keeps matching keys and values with their ancestors and announces the count, Ctrl/⌘+C copies the focused node as JSON, and Copy value and Copy path act on the selected node. Strings longer than `maxStringLength` are cut until activated, and a cycle shows `[Circular]`. Numbers are shown raw rather than locale-formatted, because inspecting data needs the exact value. `renderValue` draws primitives your way, a date for an ISO string, say; keep it free of links and buttons, as a tree's rows are. Collapsed children aren't rendered, but the whole value is walked once, so for a very large payload pass the part being inspected.

```svelte
<JsonView value={response} label="Response" expandDepth={2} hideRoot />
```

**When not to virtualise.** Find-in-page and a screen reader's browse mode only reach rows that are in the DOM, so a `VirtualList` hides the rest of its rows from both — on every platform, that is the trade-off of windowing. Reach for it when rendering everything is the problem (thousands of rows), and give content that must be findable a search over the whole collection (`total`-aware) or `Pagination` instead. For a few hundred rows use `ItemList` with `lazyRender`: `content-visibility: auto` skips the off-screen rows' layout and paint while every row stays findable. `VirtualList` rows are in normal flow between two `aria-hidden` spacers; a measured row is observed by its border box, so space rows with padding, not vertical margin, and keep `key` unique and stable — it is what carries focus and measurements across scrolling.

**Moving cards between stages.** `KanbanBoard` is `SortableList` in two dimensions: bindable `columns` (`BoardColumn`: `id`, `title`, `cards`, optional `limit`), a `key` and a `cardLabel` per card, and a `card` snippet for its content. A card moves by its handle (Space picks up, the arrows move within and across columns, Space drops, Escape cancels), by pointer drag, or through its "Move to" menu, which needs no mode at all and is the path to point switch and voice users at. `onMove(cardId, toColumn, toIndex, signal)` persists the move; reject to roll it back (the failure is announced), and the signal aborts when a later move supersedes it. With `enforceLimits`, a column at its `limit` refuses cards, and the keyboard steps past it. On a narrow screen the board scrolls sideways.

`data` also exports `move(items, from, to)` (a reordered copy; `to` is clamped), `defaultSortableAnnouncements` and the type `SortableAnnouncements` (`pickedUp`, `moved`, `dropped`, `cancelled`, `failed`) that `SortableList` is built on, and `pageWindow`, `pageHref`, `nextSortState`, `columnAriaSort`, the selection and visibility arithmetic `pageSelectionState(selected, pageKeys): 'none' | 'some' | 'all'`, `withKeys(selected, keys, include)` (a new `Set`), `isColumnHideable(column, index)` and `defaultHiddenColumns(columns)`, and the types `TableColumn` (with `hideable? = true`, `defaultHidden?` and the editing fields above), `TableEditing`, `CellChange`, `CellEditor`, `CellEditorContext`, `CellError`, `CellTarget` (`{ row, column }`, what the undo labels take), `TableSelection`, `TableBulkActions`, `TableRowAttributes`, `SortState`, `LinkListItemData`, `Task`, `TaskListSection`, `TaskStatus` (with `defaultTaskStatusLabels`), `ListGroupStyle`, `ListGroupVariant`, `DiffSegment`, `DiffLine`, `LineDiff`, `DiffBlock`, `SplitRow`, `SequenceEdit`, `VirtualKey`, `VirtualAlign` (`'start'\|'center'\|'end'\|'auto'`), `VirtualScrollOptions` and `VirtualListApi`, plus `TreeView`'s model and pure keyboard arithmetic: the types `TreeNode`, `TreeSelection`, `TreeRowState`, `TreeShape`, `VisibleTreeNode`, and `visibleTreeNodes(nodes, expanded, shape?)`, `staticTreeShape()`, `treeIndexOf`, `nextTreeIndex`, `previousTreeIndex`, `parentTreeIndex`, `firstChildTreeIndex`, `siblingParentIds` and `typeaheadTreeIndex(visible, index, query)`. A `TableColumn`'s `class` goes on its header and body cells; `headerClass` on its `<th scope="col">` only (`'sr-only'` for a header read but not seen). `pageHref(base, page, names?)` writes the position into `base`'s query, preserving every other parameter and the hash (JSON:API's `page[offset]`/`page[limit]` by default, exported as `PAGE_OFFSET_PARAM` / `PAGE_LIMIT_PARAM`; `names: PageParamNames` — `{ offset?, limit? }` — renames them) — the callback shape a filtered list's pager needs so its own filter survives. `pageWindow(page, total, siblings = 1): PageWindow` is the arithmetic `Pagination` draws: `{ page, pageCount, from, to, previous, next, items }`, page numbers 1-based, `previous` / `next` the neighbouring offsets (`undefined` at either end), and `items` a `readonly PageWindowItem[]` of `{ kind: 'page', page, offset, current }` and `{ kind: 'gap', after }` entries.

`DescriptionList` hands its presentation to its rows through context: `DescriptionListStyle` is `{ variant, mono, showEmpty, emptyLabel }`, `setDescriptionListStyle(() => style)` / `getDescriptionListStyle()` set and read it, and `defaultDescriptionListStyle` (`grid`, not mono, empty rows hidden, `'unrecorded'`) is what a `DescriptionRow` uses outside any list.

```svelte
<script lang="ts">
  import { Table, DataGrid, PaginationFooter, pageHref, ItemList, LinkListItem, DescriptionList, DescriptionRow, ExternalLink, type SortState, type TableColumn } from '@thomasfosterau/components';

  let sort = $state<SortState | undefined>({ key: 'name', direction: 'asc' });
  const columns: readonly TableColumn<Plant>[] = [
    { key: 'name', header: 'Plant', value: (p) => p.name, sortable: true },
    { key: 'family', header: 'Family', value: (p) => p.family },
  ];
  const href = (offset: number) => pageHref(page.url.search === '' ? '/plants' : `/plants${page.url.search}`, { offset, limit });
</script>

<Table rows={plants} {columns} rowKey={(p) => p.id} caption="Everything sown this season" bind:sort onSort={reload} />

<!-- A bounded set the page already holds — so the grid does the work. -->
<DataGrid rows={devices} {columns} rowKey={(d) => d.id} filterable pageSize={10} caption="Your devices" />

<PaginationFooter shown={plants.length} {offset} {limit} total={meta.totalCount} {href} />

<ItemList items={gardens} variant="cards" getKey={(g) => g.id} emptyMessage="No gardens yet.">
  {#snippet item(garden)}<LinkListItem href={garden.href} title={garden.title} subtitle={garden.subtitle} />{/snippet}
</ItemList>

<DescriptionList variant="card">
  <DescriptionRow label="Captured"><DateTime value={media.capturedAt} dateStyle="long" /></DescriptionRow>
  <!-- No licence recorded? The row is simply not there. -->
  <DescriptionRow label="Licence">{#if media.licence}<Link href={media.licence.href}>{media.licence.name}</Link>{/if}</DescriptionRow>
</DescriptionList>

<!-- `bare`: the page owns the grid; rows and its own pairs share the two columns. -->
<DescriptionList variant="bare" class="grid grid-cols-[auto_1fr] gap-x-4">
  <dt>Name</dt><dd>{organisation.name}</dd>
  <DescriptionRow label="Website"><ExternalLink href={organisation.website}>{organisation.website}</ExternalLink></DescriptionRow>
</DescriptionList>
```

## Grouping a burst of chat messages

`ChatBubble` takes `grouped` for the second and later messages of a run from one author. The caller computes the run, so `MessageThread` stays a plain list of children:

```svelte
<MessageThread label="Comments on Bed 4">
  {#each messages as m, i (m.id)}
    <ChatBubble author={m.author} sentAt={m.sentAt} grouped={i > 0 && messages[i - 1].author === m.author}>
      {#snippet avatar()}<Avatar name={m.author} src={m.avatarUrl} />{/snippet}
      {m.body}
    </ChatBubble>
  {/each}
</MessageThread>
```

A grouped bubble keeps its header and is named as before ("Ada Lovelace, 3 minutes ago"); the header is only visually hidden (`sr-only`), because a reader moving from message to message would otherwise lose the author on every message after the first. The repeated avatar is not shown, but its box keeps its width (`invisible`) so the bubbles stay aligned, and the vertical padding between grouped bubbles is tightened. Group on the author, not on the time: a long pause inside a run is still one author, so pass your own test if a gap should start a new turn.
