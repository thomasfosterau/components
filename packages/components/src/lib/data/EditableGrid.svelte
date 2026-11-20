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
  - Undo (`undo`): in navigation mode Ctrl/⌘+Z undoes the last
    committed edit and Ctrl/⌘+Shift+Z or Ctrl+Y redoes it; in edit mode
    those keys are the editor control's own. An undo in `'batch'` puts the
    cell's previous value back into `changes` (so undoing a cell's only edit
    drops it from the list); in `'cell'` it is a commit like any other,
    `onCellCommit({ from: current, to: previous })`, busy until it settles
    and rolled back if rejected — the step then stays where it was. Focus
    moves to the cell when it is on screen, and `undoneLabel` /
    `redoneLabel` is announced through the polite region. The history
    (`grid-edit.ts`) is a stack of steps, each the `CellChange`s of one
    commit; a commit whose save is rejected leaves it, a new commit empties
    the redo side, and the whole history is dropped once a row it names
    leaves `allRows`.
  - Copy and paste, in navigation mode: Ctrl/⌘+C copies the active
    cell's text (`format`, a date's ISO form, else the value) through the
    `copy` event's `clipboardData`, unless the reader has selected text of
    their own. Ctrl/⌘+V into an editable cell reads the `paste` event's
    `clipboardData` (no permission prompt), turns the text into the editor's
    value (`parse`, a number, a select option by value or label, an ISO
    date), runs `validate` and commits as Enter does, without moving: one
    undoable step. Text the editor cannot take, or that fails `validate`,
    commits nothing and marks the cell in error with `pasteFailedLabel` or
    the messages, announced through the polite region. In edit mode both
    are the editor control's own.
  - Range selection: Shift+arrow keys (and Shift+Home/End/Page
    keys) extend a block of body cells from the cell they started on; each
    cell in it carries `aria-selected="true"` and the grid
    `aria-multiselectable="true"`. Any other move, a click, Escape or
    opening an editor drops it. Copy writes the block as tab-separated
    lines. Pasting a tab-separated block (a spreadsheet's copy) fills the
    cells from the range's top-left, or the active cell, and one value
    pasted over a range fills every cell in it. It is all or nothing: a
    block running past the grid commits nothing and announces
    `pasteOutsideLabel`, and a cell that cannot take its text or fails
    `validate` is marked in error and nothing is committed. A paste that
    lands is one undoable step.

  `virtual` (for a large import): every row of the result is in the
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
  import { flushSync, tick, untrack, type Snippet } from 'svelte';
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
    clipboardTable,
    copyText,
    currentValue,
    editorText,
    emptyEditHistory,
    formatCellValue,
    historyFor,
    isCellEditable,
    namedEditor,
    originalValue,
    pastedValue,
    rejectionMessage,
    sameCellValue,
    tableText,
    travel,
    withChange,
    withoutStep,
    withStep,
    type CellLookup,
    type EditHistory,
    type EditStep,
  } from './grid-edit.ts';
  import {
    clampPoint,
    extendsRange,
    gridEditKey,
    gridEditStart,
    gridHistoryKey,
    gridMove,
    gridRange,
    inGridRange,
    isMultiCell,
    pointAfterCommit,
    type GridEditKey,
    type GridEditStart,
    type GridHistoryKey,
    type GridPoint,
    type GridRange,
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
    type CellTarget,
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
    /** A paste's error when the cell's editor cannot take the pasted text. */
    pasteFailedLabel: string;
    /** What is announced when a pasted block runs past the grid. */
    pasteOutsideLabel: string;
    /** Keep an undo history, which Ctrl/⌘+Z and Ctrl/⌘+Shift+Z walk. */
    undo: boolean;
    /** What is announced when an edit is undone. */
    undoneLabel: (target: CellTarget<T>) => string;
    /** What is announced when an edit is redone. */
    redoneLabel: (target: CellTarget<T>) => string;
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
    pasteFailedLabel,
    pasteOutsideLabel,
    undo,
    undoneLabel,
    redoneLabel,
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
  /** Why a cell's last save (`'cell'` mode) or paste was rejected. */
  const saveErrors = new SvelteMap<string, string>();
  const controllers = new Map<string, AbortController>();
  /** The undo history; immutable values, replaced on every change. */
  let history = $state.raw<EditHistory<T>>(emptyEditHistory());

  // Replaced rows invalidate the history: an old edit replayed onto new data
  // would write values the reader never typed there.
  $effect.pre(() => {
    const keys = new Set(allRows.map((row) => rowKey(row)));
    untrack(() => {
      history = historyFor(history, keys);
    });
  });

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
  /** Range selection's fixed corner: where a Shift+arrow run started, or `undefined`. */
  let anchor = $state<GridPoint | undefined>();
  const isBodyPoint = (point: GridPoint): boolean => point.row >= 1 && point.col >= offset;
  /** The selected block of two or more body cells, or `undefined`. */
  const selectedRange = $derived.by((): GridRange | undefined => {
    if (anchor === undefined) return undefined;
    const corner = clampPoint(anchor, bounds);
    if (!isBodyPoint(corner) || !isBodyPoint(at)) return undefined;
    const range = gridRange(corner, at);
    return isMultiCell(range) ? range : undefined;
  });
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
    anchor = undefined;
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

  /** What a rejected save does to the undo history, beyond rolling the cell back. */
  type OnRejected = () => void;

  function settle(
    change: CellChange<T>,
    column: TableColumn<T>,
    controller: AbortController,
    failure: unknown,
    onRejected: OnRejected,
  ): void {
    if (controller.signal.aborted) return;
    const key = cellKey(change.rowKey, change.column);
    controllers.delete(key);
    pending.delete(key);
    busy.delete(key);
    if (failure === undefined) return;
    const message = rejectionMessage(failure, saveFailedLabel);
    saveErrors.set(key, message);
    announcement = commitErrorLabel({ row: change.row, column, message });
    onRejected();
  }

  async function persist(
    commit: (change: CellChange<T>, signal: AbortSignal) => Promise<void>,
    change: CellChange<T>,
    column: TableColumn<T>,
    controller: AbortController,
    onRejected: OnRejected,
  ): Promise<void> {
    let failure: unknown;
    try {
      await commit(change, controller.signal);
    } catch (reason) {
      failure = reason ?? saveFailedLabel;
    }
    settle(change, column, controller, failure, onRejected);
  }

  /** `'cell'` mode: show the value at once, and hand it to `onCellCommit`. */
  function save(change: CellChange<T>, column: TableColumn<T>, onRejected: OnRejected): void {
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
    void persist(onCellCommit, change, column, controller, onRejected);
  }

  /**
   * Put `value` in a cell: into `changes` (batch), or through a save (cell)
   * whose rejection runs `onRejected`.
   */
  function write(row: T, column: TableColumn<T>, value: unknown, onRejected: OnRejected): void {
    const key = rowKey(row);
    const change = { rowKey: key, column: column.key, row, from: originalValue(column, row), to: value };
    saveErrors.delete(cellKey(key, column.key));
    if (editing === 'batch') changes = withChange(changes, change);
    else save(change, column, onRejected);
  }

  /** A reader's commit: written, and recorded as one undoable step. */
  function apply(row: T, column: TableColumn<T>, value: unknown): void {
    const previous = currentValue(lookup, column, row);
    if (!undo || sameCellValue(previous, value)) {
      write(row, column, value, () => {});
      return;
    }
    const step: EditStep<T> = [{ rowKey: rowKey(row), column: column.key, row, from: previous, to: value }];
    history = withStep(history, step);
    write(row, column, value, () => {
      history = withoutStep(history, step);
    });
  }

  /** Several cells (a pasted block) written together, and recorded as one undoable step. */
  function applyAll(entries: readonly (CellTarget<T> & { readonly value: unknown })[]): void {
    const step: EditStep<T> = entries
      .map(({ row, column, value }) => ({
        rowKey: rowKey(row),
        column: column.key,
        row,
        from: currentValue(lookup, column, row),
        to: value,
      }))
      .filter((change) => !sameCellValue(change.from, change.to));
    const recorded = undo && step.length > 0;
    if (recorded) history = withStep(history, step);
    for (const { row, column, value } of entries) {
      write(row, column, value, () => {
        if (recorded) history = withoutStep(history, step);
      });
    }
  }

  /** A step's cells as they stand now, or `undefined` if any is gone or no longer editable. */
  function stepTargets(step: EditStep<T>): (CellTarget<T> & { readonly change: CellChange<T> })[] | undefined {
    const targets: (CellTarget<T> & { readonly change: CellChange<T> })[] = [];
    for (const change of step) {
      const row = allRows.find((candidate) => rowKey(candidate) === change.rowKey);
      const column = columns.find((candidate) => candidate.key === change.column);
      if (row === undefined || column === undefined || !isCellEditable(column, row, editing)) return undefined;
      targets.push({ row, column, change });
    }
    return targets;
  }

  /** Undo or redo one step: write each cell's earlier or later value, focus the first and announce it. */
  function replay(direction: GridHistoryKey): void {
    const moved = travel(history, direction);
    if (moved === undefined) return;
    const { step } = moved;
    history = moved.history;
    const targets = stepTargets(step);
    const first = targets?.[0];
    if (targets === undefined || first === undefined) {
      history = withoutStep(history, step);
      return;
    }
    const restore = direction === 'undo' ? 'past' : 'future';
    for (const { row, column, change } of targets) {
      write(row, column, direction === 'undo' ? change.from : change.to, () => {
        history = withoutStep(history, step, restore);
      });
    }
    const index = rows.findIndex((candidate) => rowKey(candidate) === rowKey(first.row));
    const col = shownColumns.indexOf(first.column);
    if (index !== -1 && col !== -1) focusPoint({ row: index + 1, col: col + offset });
    // Cleared first, so the same words twice in a row are announced twice.
    announcement = '';
    flushSync();
    announcement = (direction === 'undo' ? undoneLabel : redoneLabel)(first);
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
    const direction = undo ? gridHistoryKey(event) : undefined;
    if (direction !== undefined) {
      event.preventDefault();
      replay(direction);
      return;
    }
    const next = gridMove(event, at, bounds);
    if (next !== undefined) {
      event.preventDefault();
      const corner = extendsRange(event) && isBodyPoint(at) && isBodyPoint(next) ? (anchor ?? at) : undefined;
      focusPoint(next);
      // After the focus, whose `focusin` drops any range.
      anchor = corner;
      return;
    }
    if (event.key === 'Escape' && selectedRange !== undefined) {
      event.preventDefault();
      anchor = undefined;
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

  /** Whether the clipboard keys are the grid's: navigation mode, with no text of the reader's own selected. */
  function clipboardFree(): boolean {
    if (edit !== undefined) return false;
    const highlighted = document.getSelection();
    return highlighted === null || highlighted.isCollapsed;
  }

  /** A range's body cells, row by row. */
  function rangeCells(range: GridRange): ReturnType<typeof cellAt>[][] {
    const lines: ReturnType<typeof cellAt>[][] = [];
    for (let row = range.top; row <= range.bottom; row++) {
      const line: ReturnType<typeof cellAt>[] = [];
      for (let col = range.left; col <= range.right; col++) line.push(cellAt({ row, col }));
      lines.push(line);
    }
    return lines;
  }

  const cellCopy = (target: ReturnType<typeof cellAt>): string =>
    target === undefined ? '' : copyText(target.column, currentValue(lookup, target.column, target.row));

  function oncopy(event: ClipboardEvent): void {
    if (!clipboardFree() || event.clipboardData === null) return;
    const target = cellAt(at);
    if (selectedRange === undefined && target === undefined) return;
    const text =
      selectedRange === undefined
        ? cellCopy(target)
        : tableText(rangeCells(selectedRange).map((line) => line.map(cellCopy)));
    event.clipboardData.setData('text/plain', text);
    event.preventDefault();
  }

  /** Say `message` in the polite region, cleared first so the same words twice are said twice. */
  function announce(message: string): void {
    announcement = '';
    flushSync();
    announcement = message;
  }

  /** A paste the cell refused: marked in error with `message`, and announced. */
  function refusePaste(target: CellTarget<T>, message: string): void {
    saveErrors.set(cellKey(rowKey(target.row), target.column.key), message);
    announce(cellErrorLabel({ ...target, message }));
  }

  /** One cell's pasted text as the value to commit, or why the cell refuses it. */
  function pasteInto(
    target: CellTarget<T>,
    text: string,
  ): { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly message: string } {
    const result = isCellEditable(target.column, target.row, editing) ? pastedValue(target.column, text) : undefined;
    if (result === undefined || !result.ok) return { ok: false, message: pasteFailedLabel };
    const messages = target.column.validate?.(result.value, target.row) ?? [];
    return messages.length > 0 ? { ok: false, message: messages.join(' ') } : result;
  }

  /** The active cell's own paste: one value, through its editor's rules. */
  function pasteOne(event: ClipboardEvent, text: string): void {
    const target = cellAt(at);
    if (target === undefined || !isCellEditable(target.column, target.row, editing)) return;
    const result = pastedValue(target.column, text);
    if (result === undefined) return;
    event.preventDefault();
    if (!result.ok) {
      refusePaste(target, pasteFailedLabel);
      return;
    }
    const messages = target.column.validate?.(result.value, target.row) ?? [];
    if (messages.length > 0) refusePaste(target, messages.join(' '));
    else apply(target.row, target.column, result.value);
  }

  /**
   * Where a block lands: every cell of the selected range for one value,
   * else the block's own shape from the range's top-left or the active cell.
   */
  function pasteArea(block: readonly (readonly string[])[], single: boolean): GridRange {
    const corner = selectedRange ?? gridRange(at, at);
    if (single) return corner;
    const width = Math.max(...block.map((line) => line.length));
    return { top: corner.top, left: corner.left, bottom: corner.top + block.length - 1, right: corner.left + width - 1 };
  }

  /** A block pasted across cells: all of it committed as one undoable step, or none of it. */
  function pasteBlock(block: readonly (readonly string[])[], single: boolean): void {
    const area = pasteArea(block, single);
    if (area.bottom > rows.length || area.right > shownColumns.length + offset - 1) {
      announce(pasteOutsideLabel);
      return;
    }
    const entries: (CellTarget<T> & { readonly value: unknown })[] = [];
    const failures: (CellTarget<T> & { readonly message: string })[] = [];
    rangeCells(area).forEach((line, row) => {
      line.forEach((target, col) => {
        const text = single ? block[0]?.[0] : block[row]?.[col];
        if (target === undefined || text === undefined) return;
        const result = pasteInto(target, text);
        if (result.ok) entries.push({ ...target, value: result.value });
        else failures.push({ ...target, message: result.message });
      });
    });
    const [failure] = failures;
    if (failure !== undefined) {
      for (const { row, column, message } of failures) saveErrors.set(cellKey(rowKey(row), column.key), message);
      announce(failures.length === 1 ? cellErrorLabel(failure) : errorsLabel(failures.length));
      return;
    }
    applyAll(entries);
  }

  function onpaste(event: ClipboardEvent): void {
    if (!clipboardFree() || !isBodyPoint(at)) return;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    const block = clipboardTable(text);
    const single = block.length === 1 && block[0]?.length === 1;
    if (single && selectedRange === undefined) {
      pasteOne(event, text);
      return;
    }
    event.preventDefault();
    pasteBlock(block, single);
  }


  function onfocusin(event: FocusEvent): void {
    if (!(event.target instanceof Element)) return;
    const cell = event.target.closest('[data-grid-row]');
    if (!(cell instanceof HTMLElement)) return;
    active = { row: Number(cell.dataset['gridRow']), col: Number(cell.dataset['gridCol']) };
    anchor = undefined;
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
  {@const inRange = selectedRange !== undefined && inGridRange(selectedRange, point)}
  <svelte:element
    this={column.rowHeader ? 'th' : 'td'}
    scope={column.rowHeader ? 'row' : undefined}
    role={column.rowHeader ? 'rowheader' : 'gridcell'}
    class={[
      'relative',
      column.rowHeader && 'font-normal',
      // A fixed-height row: the editor's field takes the cell's vertical padding.
      virtual && edit?.key === key && 'py-0',
      inRange && 'bg-primary/10',
      columnClass(column),
    ]}
    data-grid-row={point.row}
    data-grid-col={point.col}
    aria-colindex={point.col + 1}
    tabindex={widget ? undefined : tabStop(point.row, point.col)}
    aria-selected={inRange ? 'true' : undefined}
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
    aria-multiselectable="true"
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
    {oncopy}
    {onpaste}
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
