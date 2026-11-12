<!-- @component
The `role="grid"` table an editing `DataGrid` draws; internal, not exported.
-->
<!--
  EditableGrid — what `DataGrid` renders in place of `Table` when `editing`
  is `'cell'` or `'batch'`: the same daisyUI table, the same toolbar, sort
  headers, selection column and hidden columns, but as an APG Grid with
  editable cells. A non-editing `DataGrid` never reaches this file, so a
  read-only table stays a plain `<table>`.

  Hand-rolled, and why (AGENTS.md asks): bits-ui 2.20 has no grid or table
  primitive. The roving focus is the APG Grid pattern's own, and its key
  arithmetic is the pure `grid-keys.ts`; the editors are `fields/`
  primitives (`GridCellEditor`), so no control is hand-rolled here.

  ARIA contract (APG Grid, data grid with editable cells):
  - `<table role="grid">`, named by its caption and described by the
    edit hint, with `aria-rowcount` / `aria-colcount` for the whole result
    and `aria-rowindex` / `aria-colindex` on what is on screen (the pager
    or `virtual` windows it) — every index is the row's place in the whole
    result, never in the DOM. Header cells are `columnheader`s (`aria-sort` when
    sortable), body cells `gridcell`s — a `rowHeader` column's are
    `rowheader`s — and a cell the reader cannot edit is `aria-readonly`.
    With a selection column each row carries `aria-selected`.
  - One Tab stop: the active cell, or the one widget in it (a sort button,
    a selection box, a checkbox cell's box), has `tabindex="0"` and every
    other has `-1`. Arrows move between cells, Home / End to the row's
    ends, Ctrl+Home / Ctrl+End to the grid's, Page Up / Page Down by
    `pageStep` rows; moves stop at the edges.
  - Navigation mode → edit mode: Enter or F2 edits the active cell with the
    caret at the end; a printable character starts editing with that
    character typed over the value (text and number editors; a select or a
    date editor just opens); Alt+Down opens a select. A checkbox cell has
    no edit mode: Space toggles and commits its box.
  - Edit mode: focus is in the field primitive. Enter commits and moves
    down, Tab / Shift+Tab commit and move to the next / previous cell,
    Escape discards the draft; focus returns to the grid either way.
    Moving focus out of the grid commits. A value that fails `validate`
    is not committed: the editor stays open, showing why.
  - Errors: a cell in error is `aria-invalid` and `aria-describedby` its
    message, and shows an icon in its corner (never colour alone). Above the
    grid a `role="status"` line counts them ("2 cells have errors"), and
    each is listed as a button that brings its cell on screen and focuses it.
  - `'cell'` mode: each commit is shown at once and handed to
    `onCellCommit`; the cell is `aria-busy` until it settles. A rejection
    rolls the cell back, marks it in error with the reason, and announces
    the reason through a polite live region.
  - `'batch'` mode: commits accumulate in `changes`; a changed cell shows a
    dot and is described as `changedLabel`.

  `virtual` (for a large import, #427): every row of the result is in the
  grid's matrix but only a window of them is in the DOM. The window is
  `VirtualList`'s — the same `VirtualWindow` and `windowParts` from
  `virtual.svelte.ts`, not a second implementation — drawn as `<tr>`s
  between two `aria-hidden` spacer rows, because a `VirtualList` element
  cannot sit inside a `<tbody>`. Rows are a fixed `rowHeight`, so a move's
  target row is scrolled into view, rendered and focused in one synchronous
  step (no measuring round-trip). Keyboard moves, a commit's move and the
  error summary's buttons all scroll their row into the window before
  focusing it; Page Up / Page Down move by a viewport of rows. The row
  holding focus (the active cell, or the cell being edited) stays mounted
  however far the reader scrolls; so does the active cell once focus has
  left, because it is the grid's Tab stop. The header row is
  pinned (`table-pin-rows`) and rows do not wrap.

  A `cell` snippet that renders its own link or button adds a Tab stop the
  grid does not manage; give an editable grid plain cells.
-->
<script lang="ts" generics="T">
  import { CircleAlert } from '@lucide/svelte';
  import { flushSync, tick, type Snippet } from 'svelte';
  import type { HTMLTableAttributes } from 'svelte/elements';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import Checkbox from '../fields/Checkbox.svelte';
  import type { Size } from '../ui/tones.ts';
  import GridCellEditor from './GridCellEditor.svelte';
  import ColumnHeading from './ColumnHeading.svelte';
  import TableSelect from './TableSelect.svelte';
  import TableToolbar from './TableToolbar.svelte';
  import { choiceLabels, columnView, sortIndicator } from './table-view.ts';
  import {
    cellErrors,
    cellKey,
    currentValue,
    editorText,
    formatCellValue,
    isCellEditable,
    namedEditor,
    originalValue,
    rejectionMessage,
    sameCellValue,
    withChange,
    type CellLookup,
  } from './grid-edit.ts';
  import {
    clampPoint,
    gridEditKey,
    gridEditStart,
    gridMove,
    pointAfterCommit,
    type GridEditKey,
    type GridEditStart,
    type GridPoint,
  } from './grid-keys.ts';
  import { columnClass, tableSize } from './table-classes.ts';
  import { VirtualWindow } from './virtual.svelte.ts';
  import {
    columnAriaSort,
    nextSortState,
    pageSelectionState,
    withKeys,
    type CellChange,
    type CellEditorContext,
    type CellError,
    type SortState,
    type TableChoiceProps,
    type TableColumn,
    type TableRowAttributes,
  } from './table-types.ts';

  interface Props extends Omit<HTMLTableAttributes, 'children'>, TableChoiceProps<T> {
    /** The rows on screen, in order. */
    rows: readonly T[];
    /** Every row, which validation and the error summary cover. */
    allRows: readonly T[];
    /** Column definitions. */
    columns: readonly TableColumn<T>[];
    /** Stable identity per row. */
    rowKey: (row: T) => string;
    /** How edits are taken. */
    editing: 'cell' | 'batch';
    /** `'cell'` mode: persist one commit; reject to roll it back. */
    onCellCommit: ((change: CellChange<T>, signal: AbortSignal) => Promise<void>) | undefined;
    /** `'batch'` mode: the pending changes. Bindable. */
    changes?: CellChange<T>[] | undefined;
    /** Rows in the whole result, for `aria-rowcount`. */
    rowCount: number;
    /** How many result rows come before the first on screen. */
    rowOffset: number;
    /** Rows Page Up / Page Down move by. */
    pageStep: number;
    /** Bring a row on screen (its page, past the filter). */
    onReveal: (row: T) => void;
    /** Window `rows` (all of them, unpaged) instead of rendering every one. */
    virtual: boolean;
    /** `virtual`: each body row's fixed height in px; by `size` when `undefined`. */
    rowHeight: number | undefined;
    /** `virtual`: the scrolling body's maximum height, a CSS length. */
    viewportHeight: string;
    caption: string | undefined;
    captionHidden: boolean | undefined;
    size: Size | undefined;
    zebra: boolean | undefined;
    pinRows: boolean | undefined;
    /** Bindable. */
    sort?: SortState | undefined;
    onSort: (sort: SortState | undefined) => void;
    rowAttributes: ((row: T) => TableRowAttributes) | undefined;
    emptyMessage: string | undefined;
    emptyState: Snippet<[]> | undefined;
    sortLabel: ((column: TableColumn<T>) => string) | undefined;
    locales: string | readonly string[] | undefined;
    /** The grid's description: how to start editing. */
    editHintLabel: string;
    /** The error summary's count line. */
    errorsLabel: (count: number) => string;
    /** One entry of the error summary. */
    cellErrorLabel: (error: CellError<T>) => string;
    /** What is announced when a save is rejected. */
    commitErrorLabel: (error: CellError<T>) => string;
    /** A rejected save's message when the rejection carries none. */
    saveFailedLabel: string;
    /** A changed cell's description in batch mode. */
    changedLabel: string;
  }

  let {
    rows,
    allRows,
    columns,
    rowKey,
    editing,
    onCellCommit,
    changes = $bindable([]),
    rowCount,
    rowOffset,
    pageStep,
    onReveal,
    virtual,
    rowHeight,
    viewportHeight,
    caption,
    captionHidden = false,
    size = 'md',
    zebra = false,
    pinRows = false,
    sort = $bindable(undefined),
    onSort,
    rowAttributes,
    emptyMessage = 'Nothing to show.',
    emptyState,
    sortLabel = (column) => `Sort by ${column.header}`,
    locales,
    editHintLabel,
    errorsLabel,
    cellErrorLabel,
    commitErrorLabel,
    saveFailedLabel,
    changedLabel,
    selection = 'none',
    selected = $bindable(new Set<string>()),
    onSelectionChange,
    selectRowLabel,
    selectAllLabel,
    selectColumnLabel,
    bulkActions,
    selectedCountLabel,
    hiddenColumns = $bindable(undefined),
    columnMenu = false,
    columnMenuLabel,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const captionId = `${uid}-caption`;
  const hintId = `${uid}-hint`;
  const changedId = `${uid}-changed`;
  const editorId = `${uid}-editor`;
  const errorId = (index: number): string => `${uid}-error-${index}`;
  const headerId = (column: TableColumn<T>): string => `${uid}-label-${columns.indexOf(column)}`;

  /** The cell being edited, and where it is. */
  interface Edit {
    readonly key: string;
    readonly row: T;
    readonly column: TableColumn<T>;
    readonly point: GridPoint;
  }

  let table: HTMLTableElement | undefined = $state();
  let active = $state<GridPoint>({ row: 1, col: 0 });
  let edit = $state<Edit | undefined>();
  let draft = $state<unknown>();
  let draftErrors = $state<readonly string[]>([]);
  let announcement = $state('');
  /** `'cell'` mode: committed values whose save is in flight. */
  const pending = new SvelteMap<string, unknown>();
  const busy = new SvelteSet<string>();
  /** `'cell'` mode: why a cell's last save was rejected. */
  const saveErrors = new SvelteMap<string, string>();
  const controllers = new Map<string, AbortController>();

  $effect(() => () => {
    for (const controller of controllers.values()) controller.abort();
  });

  /** The columns drawn, the strings, and where the data columns start (past the selection column). */
  const layout = $derived.by(() => {
    const given = { selectRowLabel, selectAllLabel, selectColumnLabel, selectedCountLabel, columnMenuLabel };
    const withSelection = selection !== 'none';
    return {
      view: columnView(columns, hiddenColumns, columnMenu),
      labels: choiceLabels(given, columns),
      selectable: withSelection,
      offset: withSelection ? 1 : 0,
    };
  });
  const view = $derived(layout.view);
  const hidden = $derived(view.hidden);
  const shownColumns = $derived(view.shown);
  const labels = $derived(layout.labels);
  const selectable = $derived(layout.selectable);
  const offset = $derived(layout.offset);
  const pageKeys = $derived(rows.map((row) => rowKey(row)));
  const pageState = $derived(pageSelectionState(selected, pageKeys));

  /**
   * `virtual`'s default row heights: a daisyUI table row of each size, with
   * room for the `sm` field primitive an editing cell holds.
   */
  const rowHeights: Record<Size, number> = { xs: 36, sm: 40, md: 48, lg: 64, xl: 76 };
  const pitch = $derived(rowHeight ?? rowHeights[size]);

  let viewport: HTMLDivElement | undefined = $state();
  let headerRow: HTMLTableRowElement | undefined = $state();
  let tbody: HTMLTableSectionElement | undefined = $state();

  /** `virtual`: `VirtualList`'s windowing over the body rows, at a fixed pitch. */
  const rowWindow = new VirtualWindow({
    count: () => rows.length,
    keyAt: (index) => pageKeys[index] ?? index,
    estimateSize: () => pitch,
    overscan: () => 6,
    measure: () => false,
  });
  /** Page Up / Page Down: a page of rows, or in `virtual` a viewport's worth. */
  const page = $derived(virtual ? Math.max(1, Math.floor(rowWindow.viewportSize / pitch)) : pageStep);
  const bounds = $derived({ rows: rows.length + 1, cols: shownColumns.length + offset, page });
  const at = $derived(clampPoint(active, bounds));
  /**
   * `virtual`: the window, plus the active cell's row wherever it is. Focus
   * in the grid is always on the active cell (`onfocusin` makes it so), so
   * this keeps a focused cell or an open editor mounted however far the
   * reader scrolls — and keeps the roving Tab stop in the DOM after focus
   * has left, so Tab returns to it.
   */
  const parts = $derived(virtual ? rowWindow.parts(at.row > 0 ? at.row - 1 : undefined) : []);

  const batch = $derived(new Map(changes.map((change) => [cellKey(change.rowKey, change.column), change])));
  const lookup: CellLookup<T> = {
    rowKey: (row) => rowKey(row),
    overrides: {
      has: (key) => pending.has(key) || batch.has(key),
      get: (key) => (pending.has(key) ? pending.get(key) : batch.get(key)?.to),
    },
  };

  const errors = $derived.by(() => {
    const found = cellErrors(allRows, columns, lookup, saveErrors);
    const open = edit;
    if (open === undefined || draftErrors.length === 0) return found;
    const entry = { key: open.key, row: open.row, column: open.column, message: draftErrors.join(' ') };
    return found.some((error) => error.key === open.key)
      ? found.map((error) => (error.key === open.key ? entry : error))
      : [...found, entry];
  });
  const errorIndex = $derived(new Map(errors.map((error, index) => [error.key, index])));

  /**
   * `virtual`: read the scroller into the window. The body is visible from
   * below the (sticky) header row to the scroller's bottom edge, so a row
   * scrolled to `'auto'` is never left under the header.
   */
  function measureWindow(): void {
    if (viewport === undefined || tbody === undefined) return;
    const top = viewport.getBoundingClientRect().top + viewport.clientTop;
    const visibleTop = Math.max(top, headerRow?.getBoundingClientRect().bottom ?? top);
    rowWindow.viewportSize = Math.max(top + viewport.clientHeight - visibleTop, 0);
    rowWindow.scrollOffset = visibleTop - tbody.getBoundingClientRect().top;
  }

  $effect(() => {
    const target = viewport;
    if (!virtual || target === undefined) return;
    measureWindow();
    const onChange = (): void => measureWindow();
    target.addEventListener('scroll', onChange, { passive: true });
    const resize = new ResizeObserver(onChange);
    resize.observe(target);
    return () => {
      target.removeEventListener('scroll', onChange);
      resize.disconnect();
    };
  });

  /** `virtual`: scroll body row `index` (0-based) fully into view, so the window renders it. */
  function bringIntoView(index: number): void {
    if (!virtual || viewport === undefined) return;
    measureWindow();
    const delta = rowWindow.alignedOffset(index, 'auto') - rowWindow.scrollOffset;
    if (Math.abs(delta) < 1) return;
    viewport.scrollBy({ top: delta, behavior: 'instant' });
    measureWindow();
  }

  const select = (next: Set<string>): void => {
    selected = next;
    onSelectionChange?.(next);
  };

  const toggleSort = (column: TableColumn<T>): void => {
    const next = nextSortState(sort, column.key);
    sort = next;
    onSort(next);
  };

  /** The roving tabindex: `0` on the active cell's focus target outside edit mode, else `-1`. */
  const tabStop = (row: number, col: number): number =>
    edit === undefined && at.row === row && at.col === col ? 0 : -1;

  const cellElement = (point: GridPoint): Element | null =>
    table?.querySelector(`[data-grid-row="${point.row}"][data-grid-col="${point.col}"]`) ?? null;

  /** The body cell at a point, or `undefined` for the header row and the selection column. */
  function cellAt(point: GridPoint): { readonly row: T; readonly column: TableColumn<T> } | undefined {
    const row = rows[point.row - 1];
    const column = shownColumns[point.col - offset];
    return point.row === 0 || row === undefined || column === undefined ? undefined : { row, column };
  }

  function focusPoint(point: GridPoint): void {
    active = point;
    if (point.row > 0) bringIntoView(point.row - 1);
    flushSync();
    const cell = cellElement(point);
    const target = cell?.querySelector('[data-grid-target]') ?? cell;
    if (target instanceof HTMLElement) target.focus();
  }

  /** Focus the editor's control: select its text when typing over it, else put the caret at the end. */
  function focusEditor(point: GridPoint, start: GridEditStart): void {
    const control = cellElement(point)?.querySelector(
      'input:not([type="hidden"]), select, textarea, [role="spinbutton"], [tabindex="0"]',
    );
    if (!(control instanceof HTMLElement)) return;
    control.focus();
    if (control instanceof HTMLInputElement) {
      if (start === 'type') control.select();
      else control.setSelectionRange(control.value.length, control.value.length);
    }
    if (start === 'open' && control instanceof HTMLSelectElement) {
      try {
        control.showPicker();
      } catch {
        // Without a user activation, or where unsupported, the select just stays focused.
      }
    }
  }

  /** Whether a navigation-mode key starts editing the cell at `point`; starts it if so. */
  function beginEdit(point: GridPoint, start: GridEditStart): boolean {
    const target = cellAt(point);
    if (target === undefined || !isCellEditable(target.column, target.row, editing)) return false;
    const kind = namedEditor(target.column);
    if (kind === 'checkbox') return false;
    const value = currentValue(lookup, target.column, target.row);
    if (kind === 'text') draft = editorText(target.column, value);
    else if (kind === 'select') draft = typeof value === 'string' ? value : '';
    else draft = value;
    draftErrors = [];
    edit = { key: cellKey(rowKey(target.row), target.column.key), ...target, point };
    active = point;
    flushSync();
    focusEditor(point, start);
    return true;
  }

  /** The draft as the value to commit: a text editor's text through the column's `parse`. */
  function draftValue(column: TableColumn<T>): unknown {
    if (namedEditor(column) !== 'text') return draft;
    const text = typeof draft === 'string' ? draft : '';
    return column.parse === undefined ? text : column.parse(text);
  }

  function settle(change: CellChange<T>, column: TableColumn<T>, controller: AbortController, failure: unknown): void {
    if (controller.signal.aborted) return;
    const key = cellKey(change.rowKey, change.column);
    controllers.delete(key);
    pending.delete(key);
    busy.delete(key);
    if (failure === undefined) return;
    const message = rejectionMessage(failure, saveFailedLabel);
    saveErrors.set(key, message);
    announcement = commitErrorLabel({ row: change.row, column, message });
  }

  async function persist(
    commit: (change: CellChange<T>, signal: AbortSignal) => Promise<void>,
    change: CellChange<T>,
    column: TableColumn<T>,
    controller: AbortController,
  ): Promise<void> {
    let failure: unknown;
    try {
      await commit(change, controller.signal);
    } catch (reason) {
      failure = reason ?? saveFailedLabel;
    }
    settle(change, column, controller, failure);
  }

  /** `'cell'` mode: show the value at once, and hand it to `onCellCommit`. */
  function save(change: CellChange<T>, column: TableColumn<T>): void {
    const key = cellKey(change.rowKey, change.column);
    controllers.get(key)?.abort();
    controllers.delete(key);
    pending.delete(key);
    busy.delete(key);
    if (onCellCommit === undefined || sameCellValue(change.from, change.to)) return;
    const controller = new AbortController();
    controllers.set(key, controller);
    pending.set(key, change.to);
    busy.add(key);
    announcement = '';
    void persist(onCellCommit, change, column, controller);
  }

  function apply(row: T, column: TableColumn<T>, value: unknown): void {
    const key = rowKey(row);
    const change = { rowKey: key, column: column.key, row, from: originalValue(column, row), to: value };
    saveErrors.delete(cellKey(key, column.key));
    if (editing === 'batch') changes = withChange(changes, change);
    else save(change, column);
  }

  /**
   * Commit the open edit and, unless `move` is `undefined` (focus left the
   * grid), move focus. A draft that fails `validate` stays open with its
   * messages instead.
   */
  function commitEdit(move: GridEditKey | 'stay' | undefined): void {
    const open = edit;
    if (open === undefined) return;
    const value = draftValue(open.column);
    const messages = open.column.validate?.(value, open.row) ?? [];
    if (messages.length > 0) {
      draftErrors = messages;
      return;
    }
    edit = undefined;
    draftErrors = [];
    apply(open.row, open.column, value);
    if (move === undefined) return;
    focusPoint(move === 'stay' ? open.point : pointAfterCommit(move, open.point, bounds));
  }

  function cancelEdit(): void {
    const open = edit;
    if (open === undefined) return;
    edit = undefined;
    draftErrors = [];
    focusPoint(open.point);
  }

  function editModeKey(event: KeyboardEvent): void {
    const action = gridEditKey(event);
    if (action === undefined || event.defaultPrevented) return;
    event.preventDefault();
    if (action === 'cancel') cancelEdit();
    else commitEdit(action);
  }

  function navigationKey(event: KeyboardEvent): void {
    const next = gridMove(event, at, bounds);
    if (next !== undefined) {
      event.preventDefault();
      focusPoint(next);
      return;
    }
    const start = gridEditStart(event);
    if (start === undefined) return;
    const target = cellAt(at);
    // Typing over a select or a date would type into nothing; those just open.
    const typesThrough =
      start === 'type' && target !== undefined && ['text', 'number', undefined].includes(namedEditor(target.column));
    if (beginEdit(at, start) && !typesThrough) event.preventDefault();
  }

  function onkeydown(event: KeyboardEvent): void {
    if (edit === undefined) navigationKey(event);
    else editModeKey(event);
  }

  function onfocusin(event: FocusEvent): void {
    if (!(event.target instanceof Element)) return;
    const cell = event.target.closest('[data-grid-row]');
    if (!(cell instanceof HTMLElement)) return;
    active = { row: Number(cell.dataset['gridRow']), col: Number(cell.dataset['gridCol']) };
  }

  function onfocusout(event: FocusEvent): void {
    const open = edit;
    if (open === undefined) return;
    const cell = cellElement(open.point);
    if (event.relatedTarget instanceof Node && cell?.contains(event.relatedTarget)) return;
    commitEdit(undefined);
  }

  /** The error summary's link: bring the cell on screen (showing its column) and focus it. */
  async function reveal(error: CellError<T>): Promise<void> {
    onReveal(error.row);
    if (hidden.has(error.column.key)) hiddenColumns = withKeys(hidden, [error.column.key], false);
    await tick();
    const row = rows.findIndex((candidate) => rowKey(candidate) === rowKey(error.row));
    const col = shownColumns.indexOf(error.column);
    if (row !== -1 && col !== -1) focusPoint({ row: row + 1, col: col + offset });
  }

  const editorContext = (open: Edit): Omit<CellEditorContext<T>, 'value' | 'control'> => ({
    row: open.row,
    update: (value) => {
      draft = value;
    },
    commit: (...value: [unknown?]) => {
      if (value.length > 0) draft = value[0];
      commitEdit('stay');
    },
    cancel: cancelEdit,
  });

  const describedBy = (key: string, changed: boolean): string | undefined => {
    const index = errorIndex.get(key);
    const ids = [index === undefined ? '' : errorId(index), changed ? changedId : ''].filter(Boolean);
    return ids.length === 0 ? undefined : ids.join(' ');
  };
</script>

{#snippet selectHeader()}
  <th
    scope="col"
    class="w-0"
    data-grid-row="0"
    data-grid-col="0"
    aria-colindex={1}
    tabindex={selection === 'multiple' ? undefined : tabStop(0, 0)}
  >
    <TableSelect
      header
      selection={selection === 'single' ? 'single' : 'multiple'}
      label={selection === 'single' ? labels.selectColumnLabel : labels.selectAllLabel}
      data-grid-target
      tabindex={tabStop(0, 0)}
      disabled={pageKeys.length === 0}
      checked={pageState === 'all'}
      indeterminate={pageState === 'some'}
      onToggle={(checked) => select(withKeys(selected, pageKeys, checked))}
    />
  </th>
{/snippet}

{#snippet selectCell(row: T, key: string, index: number)}
  <td role="gridcell" class="w-0" data-grid-row={index} data-grid-col="0" aria-colindex={1}>
    <TableSelect
      header={false}
      selection={selection === 'single' ? 'single' : 'multiple'}
      label={labels.selectRowLabel(row)}
      data-grid-target
      tabindex={tabStop(index, 0)}
      name={selection === 'single' ? `${uid}-select` : undefined}
      value={selection === 'single' ? key : undefined}
      checked={selected.has(key)}
      onToggle={(checked) =>
        select(selection === 'single' ? new Set([key]) : withKeys(selected, [key], checked))}
    />
  </td>
{/snippet}

{#snippet columnHeader(column: TableColumn<T>, col: number)}
  <th
    scope="col"
    data-grid-row="0"
    data-grid-col={col}
    aria-colindex={col + 1}
    aria-sort={column.sortable ? columnAriaSort(sort, column.key) : undefined}
    tabindex={column.sortable ? undefined : tabStop(0, col)}
    class={[columnClass(column), column.headerClass]}
  >
    <!-- A sortable header hands its tab stop to its button. -->
    <ColumnHeading
      data-grid-target
      tabindex={tabStop(0, col)}
      onclick={() => toggleSort(column)}
      header={column.header}
      sortable={column.sortable === true}
      indicator={sortIndicator(sort, column.key)}
      label={sortLabel(column)}
    />
  </th>
{/snippet}

{#snippet cellContent(row: T, column: TableColumn<T>, key: string, point: GridPoint)}
  {#if edit !== undefined && edit.key === key}
    <GridCellEditor
      {column}
      bind:value={draft}
      context={editorContext(edit)}
      {locales}
      control={{
        id: editorId,
        labelId: headerId(column),
        describedBy: describedBy(key, false) ?? '',
        invalid: errorIndex.has(key),
        required: false,
      }}
    />
    {#if draftErrors.length > 0}
      <p class="text-error mt-1 text-xs font-normal">{draftErrors.join(' ')}</p>
    {/if}
  {:else if namedEditor(column) === 'checkbox' && isCellEditable(column, row, editing)}
    <Checkbox
      label={column.header}
      size="sm"
      class="min-h-0 p-0 [&>span]:sr-only"
      data-grid-target
      tabindex={tabStop(point.row, point.col)}
      checked={currentValue(lookup, column, row) === true}
      onchange={(event) => apply(row, column, event.currentTarget.checked)}
    />
  {:else if lookup.overrides.has(key)}
    {formatCellValue(column, lookup.overrides.get(key), locales)}
  {:else if column.cell}
    {@render column.cell(row)}
  {:else}
    {column.value(row)}
  {/if}
{/snippet}

{#snippet cellMarkers(key: string, changed: boolean)}
  {#if errorIndex.has(key)}
    <CircleAlert class="text-error absolute end-0.5 top-0.5 size-3" aria-hidden="true" />
  {/if}
  {#if changed}
    <span class="status status-info absolute start-0.5 top-0.5" aria-hidden="true"></span>
  {/if}
  {#if busy.has(key)}
    <span class="loading loading-spinner loading-xs ms-1 align-middle" aria-hidden="true"></span>
  {/if}
{/snippet}

{#snippet bodyCell(row: T, column: TableColumn<T>, point: GridPoint)}
  {@const key = cellKey(rowKey(row), column.key)}
  {@const editable = isCellEditable(column, row, editing)}
  {@const changed = editing === 'batch' && batch.has(key)}
  <!-- Only a checkbox cell hands its tab stop to a widget for good. An editing
       cell keeps its own `tabindex="-1"`: a focused cell that stopped being
       focusable would blur, and the blur would commit the edit just opened. -->
  {@const widget = editable && namedEditor(column) === 'checkbox'}
  <svelte:element
    this={column.rowHeader ? 'th' : 'td'}
    scope={column.rowHeader ? 'row' : undefined}
    role={column.rowHeader ? 'rowheader' : 'gridcell'}
    class={[
      'relative',
      column.rowHeader && 'font-normal',
      // A fixed-height row: the editor's field takes the cell's vertical padding.
      virtual && edit?.key === key && 'py-0',
      columnClass(column),
    ]}
    data-grid-row={point.row}
    data-grid-col={point.col}
    aria-colindex={point.col + 1}
    tabindex={widget ? undefined : tabStop(point.row, point.col)}
    aria-readonly={editable ? undefined : 'true'}
    aria-invalid={errorIndex.has(key) ? 'true' : undefined}
    aria-describedby={describedBy(key, changed)}
    aria-busy={busy.has(key) ? 'true' : undefined}
    ondblclick={() => {
      if (edit === undefined) beginEdit(point, 'edit');
    }}
  >
    {@render cellContent(row, column, key, point)}
    {@render cellMarkers(key, changed)}
  </svelte:element>
{/snippet}

{#snippet bodyRow(row: T, index: number)}
  {@const own = rowAttributes?.(row)}
  {@const key = rowKey(row)}
  <tr
    id={own?.id}
    aria-rowindex={rowOffset + index + 2}
    aria-selected={selectable ? selected.has(key) : undefined}
    style:height={virtual ? `${pitch}px` : undefined}
    class={[
      'hover:bg-base-200',
      selectable && selected.has(key) && 'bg-base-200',
      // `table-zebra` counts `nth-child`, which the spacers would throw off.
      virtual && zebra && index % 2 === 1 && 'bg-base-200',
      virtual && 'whitespace-nowrap',
      own?.class,
    ]}
  >
    {#if selectable}{@render selectCell(row, key, index + 1)}{/if}
    {#each shownColumns as column, col (column.key)}
      {@render bodyCell(row, column, { row: index + 1, col: col + offset })}
    {/each}
  </tr>
{/snippet}

{#snippet errorSummary()}
  <div class="mb-2">
    <p role="status" class="text-error text-sm font-medium">
      {errors.length > 0 ? errorsLabel(errors.length) : ''}
    </p>
    {#if errors.length > 0}
      <ul class="mt-1 space-y-0.5 text-sm">
        {#each errors as error (error.key)}
          <li>
            <button type="button" class="link link-hover text-start" onclick={() => void reveal(error)}>
              {cellErrorLabel(error)}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <p role="status" class="sr-only">{announcement}</p>
  </div>
{/snippet}

{#snippet descriptions()}
  <p id={hintId} class="sr-only">{editHintLabel}</p>
  <div hidden>
    <span id={changedId}>{changedLabel}</span>
    <!-- What an editor is labelled by: the bare header text, which a sortable
         header's cell (named by its sort button) is not. -->
    {#each columns as column (column.key)}
      <span id={headerId(column)}>{column.header}</span>
    {/each}
    {#each errors as error, index (error.key)}
      <span id={errorId(index)}>{error.message}</span>
    {/each}
  </div>
{/snippet}

{#snippet spacer(size: number)}
  <tr aria-hidden="true" style:height="{size}px">
    <td colspan={shownColumns.length + offset} style:padding="0" style:border="0"></td>
  </tr>
{/snippet}

{#snippet virtualRows()}
  {#each parts as part, position (part.kind === 'row' ? `r${pageKeys[part.index]}` : `s${position}`)}
    {#if part.kind === 'spacer'}
      {@render spacer(part.size)}
    {:else}
      {@const row = rows[part.index]}
      {#if row !== undefined}{@render bodyRow(row, part.index)}{/if}
    {/if}
  {/each}
{/snippet}

{#snippet body()}
  <tbody bind:this={tbody}>
    {#if rows.length === 0}
      <tr>
        <td role="gridcell" colspan={shownColumns.length + offset} class="text-base-content/60 py-8 text-center">
          {#if emptyState}{@render emptyState()}{:else}{emptyMessage}{/if}
        </td>
      </tr>
    {:else if virtual}
      {@render virtualRows()}
    {:else}
      {#each rows as row, index (rowKey(row))}
        {@render bodyRow(row, index)}
      {/each}
    {/if}
  </tbody>
{/snippet}

{#if selectable || columnMenu}
  <TableToolbar
    {selectable}
    {selected}
    clear={() => select(new Set())}
    {bulkActions}
    selectedCountLabel={labels.selectedCountLabel}
    columnChoices={view.choices}
    columnMenuLabel={labels.columnMenuLabel}
    onColumnToggle={(key, visible) => {
      hiddenColumns = withKeys(hidden, [key], !visible);
    }}
  />
{/if}

{@render errorSummary()}
{@render descriptions()}

<!-- `virtual`: this is the scroller the window reads; its height and the
     table's zero row spacing are inline because the row arithmetic depends
     on them. -->
<div
  bind:this={viewport}
  class="overflow-x-auto"
  style:max-height={virtual ? viewportHeight : undefined}
  style:overflow-y={virtual ? 'auto' : undefined}
>
  <table
    {...rest}
    bind:this={table}
    role="grid"
    aria-labelledby={caption === undefined ? undefined : captionId}
    aria-describedby={hintId}
    aria-rowcount={rowCount + 1}
    aria-colcount={shownColumns.length + offset}
    class={[
      'table bg-base-100',
      tableSize[size],
      zebra && !virtual && 'table-zebra',
      (pinRows || virtual) && 'table-pin-rows',
      className,
    ]}
    style:border-spacing={virtual ? '0' : undefined}
    {onkeydown}
    {onfocusin}
    {onfocusout}
  >
    {#if caption !== undefined}
      <caption id={captionId} class={captionHidden ? 'sr-only' : 'p-3 text-start text-sm font-medium'}>
        {caption}
      </caption>
    {/if}
    <thead>
      <tr bind:this={headerRow} aria-rowindex={1}>
        {#if selectable}{@render selectHeader()}{/if}
        {#each shownColumns as column, col (column.key)}
          {@render columnHeader(column, col + offset)}
        {/each}
      </tr>
    </thead>
    {@render body()}
  </table>
</div>
