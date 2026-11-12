/**
 * `DataGrid`'s contract: it is `Table` + `Pagination` plus three decisions —
 * sorting that reorders the rows, a filter that searches every column's
 * VALUE, and a page index that survives a filter shrinking the result out
 * from under it. That last one is the reason the page index is clamped in a
 * derivation rather than reset in the filter's handler.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { CellChange } from '../../src/lib/data/table-types.ts';
import DataGridFixture from './fixtures/DataGridFixture.svelte';
import EditableDataGridFixture from './fixtures/EditableDataGridFixture.svelte';

/** The body rows' first data cells (past any selection cell), in render order. */
const names = (): string[] =>
  [...document.querySelectorAll('tbody tr')].map(
    (row) => row.querySelector('td:not(:has(input))')?.textContent?.trim() ?? '',
  );

test('cycles a column through ascending, descending and back to the caller’s order', async () => {
  const screen = await render(DataGridFixture, { paginated: false });
  expect(names()).toEqual(['Basil', 'Tomato', 'Garlic']);

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(names()).toEqual(['Basil', 'Garlic', 'Tomato']);

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(names()).toEqual(['Tomato', 'Garlic', 'Basil']);

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(names()).toEqual(['Basil', 'Tomato', 'Garlic']);
});

test('sorts numbers numerically, not as strings', async () => {
  const screen = await render(DataGridFixture, { paginated: false });

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Count' }));
  // Lexical order would put 100 before 30 before 9.
  expect(names()).toEqual(['Tomato', 'Basil', 'Garlic']);
});

test('filters on every column’s value, cell markup or not', async () => {
  const screen = await render(DataGridFixture, { filterable: true, paginated: false });

  const search = screen.getByRole('searchbox', { name: 'Search' });
  await userEvent.fill(search, 'gar');
  expect(names()).toEqual(['Garlic']);

  // The numeric column is part of the corpus, not just the text ones.
  await userEvent.fill(search, '100');
  expect(names()).toEqual(['Garlic']);

  await userEvent.fill(search, 'zzz');
  await expect.element(screen.getByText('Nothing to show.')).toBeInTheDocument();
});

test('does not strand the reader past the end when a filter shrinks the result', async () => {
  const screen = await render(DataGridFixture, { pageSize: 2, filterable: true });
  expect(names()).toEqual(['Basil', 'Tomato']);
  await expect.element(screen.getByText('Showing 1 to 2 of 3')).toBeInTheDocument();
  await expect.element(screen.getByText('Page 1 of 2')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(names()).toEqual(['Garlic']);
  await expect.element(screen.getByText('Showing 3 to 3 of 3')).toBeInTheDocument();

  // One match, so page 2 no longer exists — the grid clamps rather than
  // rendering an empty body over rows that are right there.
  await userEvent.fill(screen.getByRole('searchbox', { name: 'Search' }), 'Basil');
  expect(names()).toEqual(['Basil']);
});

test('returns to the first page when the sort changes the order under the reader', async () => {
  const screen = await render(DataGridFixture, { pageSize: 2 });

  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  await expect.element(screen.getByText('Page 2 of 2')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  await expect.element(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(names()).toEqual(['Basil', 'Garlic']);
});

test('changes the page size from the labelled select', async () => {
  const screen = await render(DataGridFixture, { pageSize: 2, pageSizeOptions: [2, 10] });
  expect(names()).toHaveLength(2);

  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '10');
  expect(names()).toHaveLength(3);
});

test('takes every user-facing string as a prop', async () => {
  const screen = await render(DataGridFixture, {
    filterable: true,
    pageSize: 2,
    filterLabel: 'Filtrer',
    rowsPerPageLabel: 'Lignes par page',
    showingLabel: (start, end, total) => `${start}–${end} sur ${total}`,
    pageOfLabel: (page, pages) => `${page} / ${pages}`,
    previousLabel: 'Précédent',
    nextLabel: 'Suivant',
    paginationLabel: 'Pages',
  });

  await expect.element(screen.getByRole('searchbox', { name: 'Filtrer' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('combobox', { name: 'Lignes par page' }))
    .toBeInTheDocument();
  await expect.element(screen.getByText('1–2 sur 3')).toBeInTheDocument();
  await expect.element(screen.getByText('1 / 2')).toBeInTheDocument();
  await expect.element(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
});

test('hides the pager entirely when the result is empty', async () => {
  const screen = await render(DataGridFixture, { rows: [], emptyMessage: 'No plants.' });

  await expect.element(screen.getByText('No plants.')).toBeInTheDocument();
  expect(screen.getByRole('navigation').elements()).toHaveLength(0);
});

/** The fixture's bound selection, sorted. */
const selectedKeys = (): string =>
  document.querySelector('[data-testid="selected"]')?.textContent ?? '';

test('keeps selections by key across sorting, filtering and paging', async () => {
  const screen = await render(DataGridFixture, {
    selection: 'multiple',
    pageSize: 2,
    filterable: true,
  });

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select all on this page' }));
  expect(selectedKeys()).toBe('basil,tomato');

  // Page 2 starts unselected and leaves page 1's selections alone.
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  const all = screen.getByRole('checkbox', { name: 'Select all on this page' });
  await expect.element(all).not.toBeChecked();
  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Garlic' }));
  expect(selectedKeys()).toBe('basil,garlic,tomato');

  await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
  await expect.element(screen.getByRole('checkbox', { name: 'Select Basil' })).toBeChecked();

  // A sort reorders the rows; the boxes follow the rows, not the positions.
  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Tomato' }));
  await userEvent.click(screen.getByRole('button', { name: 'Sort by Count' }));
  expect(names()).toEqual(['Tomato', 'Basil']);
  await expect.element(screen.getByRole('checkbox', { name: 'Select Tomato' })).not.toBeChecked();
  await expect.element(screen.getByRole('checkbox', { name: 'Select Basil' })).toBeChecked();

  // A filter hides rows without deselecting them.
  await userEvent.fill(screen.getByRole('searchbox', { name: 'Search' }), 'gar');
  expect(names()).toEqual(['Garlic']);
  await expect.element(screen.getByRole('checkbox', { name: 'Select Garlic' })).toBeChecked();
  expect(selectedKeys()).toBe('basil,garlic');
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 selected');
});

// Editing: `editing` other than 'none' makes the table an APG grid of
// editable cells (one Tab stop, arrow keys between cells, Enter / F2 / typing
// to edit, Enter / Tab / Escape to leave). The fixture has a text, a number,
// a select and a checkbox column, and a read-only one.

/** The focused element's text, or its value for a form control. */
const focusedText = (): string => {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLSelectElement)
    return active.value;
  return active?.textContent?.trim() ?? '';
};

const changeList = (): string =>
  document.querySelector('[data-testid="changes"]')?.textContent?.trim() ?? '';

test('stays a plain table unless editing', async () => {
  const screen = await render(EditableDataGridFixture, { editing: 'none' });
  await expect.element(screen.getByRole('table', { name: 'Plants' })).toBeInTheDocument();
  expect(screen.getByRole('grid').elements()).toHaveLength(0);
});

test('an editing grid is one Tab stop, with its size and read-only cells stated', async () => {
  const screen = await render(EditableDataGridFixture);
  const grid = screen.getByRole('grid', { name: 'Plants' });
  await expect.element(grid).toHaveAttribute('aria-rowcount', '4');
  await expect.element(grid).toHaveAttribute('aria-colcount', '5');
  expect(grid.element().querySelectorAll('[tabindex="0"]')).toHaveLength(1);

  await userEvent.tab();
  expect(focusedText()).toBe('Basil');
  await userEvent.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }).element());

  await expect
    .element(screen.getByRole('gridcell', { name: 'India' }))
    .toHaveAttribute('aria-readonly', 'true');
  await expect
    .element(screen.getByRole('gridcell', { name: 'bulb' }))
    .toHaveAttribute('aria-readonly', 'true');
  await expect
    .element(screen.getByRole('gridcell', { name: 'Basil' }))
    .not.toHaveAttribute('aria-readonly');
});

test('moves between cells with the APG grid keys', async () => {
  const screen = await render(EditableDataGridFixture);
  await userEvent.click(screen.getByRole('gridcell', { name: 'Basil' }));

  await userEvent.keyboard('{ArrowRight}');
  expect(focusedText()).toBe('30');
  await userEvent.keyboard('{ArrowDown}');
  expect(focusedText()).toBe('9');
  await userEvent.keyboard('{Home}');
  expect(focusedText()).toBe('Tomato');
  await userEvent.keyboard('{End}');
  expect(focusedText()).toBe('Peru');
  await userEvent.keyboard('{Control>}{End}{/Control}');
  expect(focusedText()).toBe('Asia');
  await userEvent.keyboard('{PageUp}');
  expect(focusedText()).toBe('Origin');
  // The header row is part of the grid: a sortable header's button takes focus.
  await userEvent.keyboard('{Control>}{Home}{/Control}');
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Sort by Name' }).element(),
  );
  await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Sort by Name' }).element(),
  );
  const grid = screen.getByRole('grid').element();
  expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
});

test('typing on a number cell edits it; Enter commits, saves and moves down', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit });
  await userEvent.click(screen.getByRole('gridcell', { name: '30' }));

  await userEvent.keyboard('12');
  const spin = screen.getByRole('spinbutton', { name: 'Count' });
  await expect.element(spin).toHaveFocus();
  await expect.element(spin).toHaveValue('12');

  await userEvent.keyboard('{Enter}');
  expect(onCellCommit).toHaveBeenCalledOnce();
  expect(onCellCommit.mock.calls[0]?.[0]).toMatchObject({
    rowKey: 'basil',
    column: 'count',
    from: 30,
    to: 12,
  });
  expect(focusedText()).toBe('9');
  await expect.element(screen.getByRole('gridcell', { name: '12' })).toBeInTheDocument();
  expect(screen.getByRole('spinbutton').elements()).toHaveLength(0);
});

test('Enter edits a text cell, Escape restores it and returns focus to the cell', async () => {
  const screen = await render(EditableDataGridFixture);
  await userEvent.click(screen.getByRole('gridcell', { name: 'Basil' }));

  await userEvent.keyboard('{Enter}');
  const input = screen.getByRole('textbox', { name: 'Name' });
  await expect.element(input).toHaveFocus();
  await expect.element(input).toHaveValue('Basil');
  await userEvent.keyboard('ica{Escape}');

  expect(screen.getByRole('textbox').elements()).toHaveLength(0);
  expect(focusedText()).toBe('Basil');
});

test('a printable character starts editing with that character; Tab commits and moves right', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit });
  await userEvent.click(screen.getByRole('gridcell', { name: 'Basil' }));

  await userEvent.keyboard('a');
  await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('a');
  await userEvent.keyboard('{Tab}');
  expect(onCellCommit.mock.calls[0]?.[0]).toMatchObject({ column: 'name', from: 'Basil', to: 'a' });
  expect(focusedText()).toBe('30');

  await userEvent.keyboard('{F2}{Shift>}{Tab}{/Shift}');
  expect(focusedText()).toBe('a');
});

test('a select cell edits with the library Select', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit });
  await userEvent.click(screen.getByRole('gridcell', { name: 'herb' }));

  await userEvent.keyboard('{Enter}');
  const select = screen.getByRole('combobox', { name: 'Kind' });
  await expect.element(select).toHaveFocus();
  await userEvent.selectOptions(select, 'fruit');
  select.element().focus();
  await userEvent.keyboard('{Enter}');
  expect(onCellCommit.mock.calls[0]?.[0]).toMatchObject({
    column: 'kind',
    from: 'herb',
    to: 'fruit',
  });
});

test('Space toggles and commits a checkbox cell', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit });
  const boxes = screen.getByRole('checkbox', { name: 'Organic' });
  await userEvent.click(screen.getByRole('gridcell', { name: 'herb' }));
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(boxes.nth(0).element());

  await userEvent.keyboard(' ');
  expect(onCellCommit.mock.calls[0]?.[0]).toMatchObject({
    column: 'organic',
    from: true,
    to: false,
  });
  await expect.element(boxes.nth(0)).not.toBeChecked();
});

test('keeps an invalid edit open, marks the cell and counts it in the summary', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit });
  await userEvent.click(screen.getByRole('gridcell', { name: 'Basil' }));
  await userEvent.keyboard('{Enter}{Control>}a{/Control}{Backspace}{Enter}');

  expect(onCellCommit).not.toHaveBeenCalled();
  const input = screen.getByRole('textbox', { name: 'Name' });
  await expect.element(input).toHaveFocus();
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveAccessibleDescription('Enter a name.');
  const cell = input.element().closest('td');
  expect(cell?.getAttribute('aria-invalid')).toBe('true');
  await expect.element(screen.getByRole('status').first()).toHaveTextContent('1 cell has an error');

  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByRole('status').first()).toHaveTextContent('');
  expect(focusedText()).toBe('Basil');
});

test('marks data that arrives invalid, and the summary focuses its cell', async () => {
  const screen = await render(EditableDataGridFixture, {
    pageSize: 2,
    initial: [
      { id: 'basil', name: 'Basil', count: 30, kind: 'herb', organic: true, origin: 'India' },
      { id: 'tomato', name: 'Tomato', count: 9, kind: 'fruit', organic: false, origin: 'Peru' },
      { id: 'garlic', name: 'Garlic', count: -4, kind: 'bulb', organic: false, origin: 'Asia' },
    ],
    errorsLabel: (count) => `${count} problem(s)`,
  });
  await expect.element(screen.getByRole('status').first()).toHaveTextContent('1 problem(s)');

  // Garlic is on page 2; the summary brings it on screen.
  await userEvent.click(
    screen.getByRole('button', { name: 'Garlic, Count: Must not be negative.' }),
  );
  const cell = screen.getByRole('gridcell', { name: '-4' });
  await expect.element(cell).toHaveFocus();
  await expect.element(cell).toHaveAttribute('aria-invalid', 'true');
  await expect.element(cell).toHaveAccessibleDescription('Must not be negative.');
});

test('shows a save in flight as busy, and rolls back and announces a rejection', async () => {
  let reject: ((reason: unknown) => void) | undefined;
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit });
  await userEvent.click(screen.getByRole('gridcell', { name: '30' }));
  await userEvent.keyboard('7{Enter}');

  const cell = screen.getByRole('gridcell', { name: '7' });
  await expect.element(cell).toHaveAttribute('aria-busy', 'true');

  reject?.(new Error('Server said no'));
  const rolledBack = screen.getByRole('gridcell', { name: '30' });
  await expect.element(rolledBack).not.toHaveAttribute('aria-busy');
  await expect.element(rolledBack).toHaveAttribute('aria-invalid', 'true');
  await expect.element(rolledBack).toHaveAccessibleDescription('Server said no');
  await expect
    .element(screen.getByText('Count for Basil was not saved: Server said no'))
    .toBeInTheDocument();
});

test('batch mode collects changes and marks each changed cell', async () => {
  const screen = await render(EditableDataGridFixture, {
    editing: 'batch',
    changedLabel: 'Edited',
  });
  await userEvent.click(screen.getByRole('gridcell', { name: '30' }));
  await userEvent.keyboard('31{Enter}');
  await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
  await userEvent.keyboard('Thai basil{Enter}');

  expect(changeList()).toBe('basil.count:30>31,basil.name:Basil>Thai basil');
  await expect
    .element(screen.getByRole('gridcell', { name: '31' }))
    .toHaveAccessibleDescription('Edited');

  // Editing a cell back to where it started takes it out of the batch.
  await userEvent.click(screen.getByRole('gridcell', { name: '31' }));
  await userEvent.keyboard('30{Enter}');
  expect(changeList()).toBe('basil.name:Basil>Thai basil');
  await expect
    .element(screen.getByRole('gridcell', { name: '30' }))
    .not.toHaveAccessibleDescription('Edited');
  // The caller's rows are untouched until it saves.
  expect(document.querySelector('[data-testid="rows"]')?.textContent).toContain('Basil=30');
});

test('a date cell edits with the library DateField', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, {
    onCellCommit,
    more: true,
    persist: false,
  });
  await userEvent.click(screen.getByRole('gridcell', { name: 'India' }));
  await userEvent.keyboard('{ArrowRight}{Enter}');
  const group = screen.getByRole('group', { name: 'Planted' });
  await expect.element(group).toBeInTheDocument();
  expect(group.element().contains(document.activeElement)).toBe(true);
  await userEvent.keyboard('{ArrowUp}{Tab}');
  expect(onCellCommit).toHaveBeenCalledOnce();
  const committed = onCellCommit.mock.calls[0]?.[0];
  expect(committed?.column).toBe('planted');
  expect(String(committed?.to)).not.toBe('2026-03-01');
});

test('a snippet editor drafts with update and commits with commit', async () => {
  const onCellCommit = vi.fn<(change: CellChange<unknown>, signal: AbortSignal) => Promise<void>>(
    async () => {},
  );
  const screen = await render(EditableDataGridFixture, { onCellCommit, more: true });
  await userEvent.click(screen.getByRole('gridcell', { name: 'India' }));
  await userEvent.keyboard('{End}{Enter}');
  const input = screen.getByRole('textbox', { name: 'Note' });
  await expect.element(input).toHaveFocus();
  await userEvent.keyboard('ok{Enter}');
  expect(onCellCommit.mock.calls[0]?.[0]).toMatchObject({ column: 'note', to: 'OK' });

  await userEvent.click(screen.getByRole('gridcell', { name: 'OK' }).first());
  await userEvent.keyboard('{Enter}');
  await userEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(onCellCommit.mock.calls[1]?.[0]).toMatchObject({ column: 'note', to: 'Done' });
});

test('an editing grid keeps row selection, as a column of boxes the grid moves through', async () => {
  const screen = await render(EditableDataGridFixture, { selection: 'multiple' });
  await userEvent.tab();
  const box = screen.getByRole('checkbox', { name: 'Select Basil' });
  await expect.element(box).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect.element(box).toBeChecked();
  expect(box.element().closest('tr')?.getAttribute('aria-selected')).toBe('true');

  await userEvent.keyboard('{ArrowUp}');
  await expect
    .element(screen.getByRole('checkbox', { name: 'Select all on this page' }))
    .toHaveFocus();
  await userEvent.keyboard('{ArrowDown}{ArrowRight}');
  expect(focusedText()).toBe('Basil');
});
