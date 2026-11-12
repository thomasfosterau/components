/**
 * `Table`'s contract: the caption as the accessible name (visible or not),
 * `<th scope="col">` headers, a sort control that is a real button driving
 * `aria-sort`, and rows that are activatable by keyboard and not only by
 * pointer.
 *
 * The component deliberately does NOT reorder its rows — a server-paged
 * caller sorts server-side — so the sort tests assert the announced state and
 * the reported change, which is the whole of what it promises.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { SortState } from '../../src/lib/data/table-types.ts';
import TableFixture from './fixtures/TableFixture.svelte';
import { rows, type Row } from './fixtures/table-data.ts';
import { instanceOf } from '../dom.ts';

/** The body rows' first cells, in render order. */
const names = (): string[] =>
  [...document.querySelectorAll('tbody tr')].map(
    (row) => row.querySelector('td')?.textContent?.trim() ?? '',
  );

test('is named by its caption, with a header per column', async () => {
  const screen = await render(TableFixture, { caption: 'Plants' });

  await expect.element(screen.getByRole('table', { name: 'Plants' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader').elements()).toHaveLength(2);
  expect(screen.getByRole('columnheader').elements()[0]?.getAttribute('scope')).toBe('col');
  expect(names()).toEqual(['Basil', 'Tomato', 'Garlic']);
});

test('keeps the caption for assistive technology when captionHidden', async () => {
  const screen = await render(TableFixture, { caption: 'Plants', captionHidden: true });

  // Still the accessible name — hidden is not removed.
  await expect.element(screen.getByRole('table', { name: 'Plants' })).toBeInTheDocument();
  const caption = screen.getByRole('table').element().querySelector('caption');
  expect(caption).toHaveClass('sr-only');
});

test('shows a visible caption when it is not hidden', async () => {
  const screen = await render(TableFixture, { caption: 'Plants' });

  expect(screen.getByRole('table').element().querySelector('caption')).not.toHaveClass('sr-only');
});

test('announces the sort state on the header and reports the change', async () => {
  const onSort = vi.fn<(sort: SortState | undefined) => void>();
  const screen = await render(TableFixture, { onSort });

  const header = screen.getByRole('columnheader').elements()[0];
  expect(header).toHaveAttribute('aria-sort', 'none');

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(header).toHaveAttribute('aria-sort', 'ascending');
  expect(onSort).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(header).toHaveAttribute('aria-sort', 'descending');
  expect(onSort).toHaveBeenLastCalledWith({ key: 'name', direction: 'desc' });

  // Third press returns to the caller's own order.
  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(header).toHaveAttribute('aria-sort', 'none');
  expect(onSort).toHaveBeenLastCalledWith(undefined);
});

test('sorts from the keyboard, because the control is a real button', async () => {
  const onSort = vi.fn<(sort: SortState | undefined) => void>();
  const screen = await render(TableFixture, { onSort });

  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Sort by Name' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  expect(onSort).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });
  expect(screen.getByRole('columnheader').elements()[0]).toHaveAttribute('aria-sort', 'ascending');
});

test('leaves a column that is not sortable silent about sorting', async () => {
  const screen = await render(TableFixture, { sortable: false });

  expect(screen.getByRole('columnheader').elements()[0]).not.toHaveAttribute('aria-sort');
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('activates a row with Enter and with Space, not only with a click', async () => {
  const onSelect = vi.fn<(row: Row) => void>();
  const screen = await render(TableFixture, { sortable: false, onSelect });

  const first = screen.getByRole('button').nth(0);
  const element = first.element();
  expect(element.tagName).toBe('TR');
  await expect.element(first).toHaveAttribute('tabindex', '0');

  instanceOf(element, HTMLElement).focus();
  await userEvent.keyboard('{Enter}');
  expect(onSelect).toHaveBeenLastCalledWith(rows[0]);

  await userEvent.keyboard(' ');
  expect(onSelect).toHaveBeenCalledTimes(2);

  await userEvent.click(screen.getByRole('button').nth(1));
  expect(onSelect).toHaveBeenLastCalledWith(rows[1]);
});

test('leaves rows inert when no handler is given', async () => {
  const screen = await render(TableFixture, { sortable: false });

  expect(screen.getByRole('row').elements()[1]).not.toHaveAttribute('tabindex');
});

test('spans the empty message across every column', async () => {
  const screen = await render(TableFixture, { rows: [], emptyMessage: 'Nothing planted yet.' });

  await expect
    .element(screen.getByRole('cell', { name: 'Nothing planted yet.' }))
    .toHaveAttribute('colspan', '2');
});

test('prefers the emptyState snippet over the message, and renders a foot', async () => {
  const screen = await render(TableFixture, {
    rows: [],
    sortable: false,
    emptyMessage: 'Nothing planted yet.',
    withEmptyState: true,
    withFoot: true,
  });

  await expect.element(screen.getByText('Sow something.')).toBeInTheDocument();
  expect(screen.getByText('Nothing planted yet.').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('cell', { name: '139 in total' })).toBeInTheDocument();
});

test('carries the size, zebra and pin modifiers onto the table', async () => {
  const screen = await render(TableFixture, {
    size: 'sm',
    zebra: true,
    pinRows: true,
    class: 'mt-4',
  });

  const table = screen.getByRole('table');
  await expect.element(table).toHaveClass('table-sm');
  await expect.element(table).toHaveClass('table-zebra');
  await expect.element(table).toHaveClass('table-pin-rows');
  await expect.element(table).toHaveClass('mt-4');
});

test('a rowHeader column renders its cells as row headers that name the row', async () => {
  const screen = await render(TableFixture, { caption: 'Plants', rowHeader: true });

  const headers = screen.getByRole('rowheader').elements();
  expect(headers.map((cell) => cell.textContent?.trim())).toEqual(['Basil', 'Tomato', 'Garlic']);
  expect(
    headers.every((cell) => cell.tagName === 'TH' && cell.getAttribute('scope') === 'row'),
  ).toBe(true);
  // The other column stays data cells; each row is one header plus one cell.
  expect(screen.getByRole('cell').elements()).toHaveLength(3);
  await expect.element(screen.getByRole('rowheader', { name: 'Basil' })).toBeInTheDocument();
});

test('without rowHeader every body cell is a data cell', async () => {
  const screen = await render(TableFixture, { caption: 'Plants' });

  expect(screen.getByRole('rowheader').elements()).toHaveLength(0);
  expect(screen.getByRole('cell').elements()).toHaveLength(6);
});

test('rowAttributes gives a row its own class and id', async () => {
  const screen = await render(TableFixture, {
    caption: 'Plants',
    sortable: false,
    rowAttributes: (row) => ({
      id: `plant-${row.id}`,
      class: row.id === 'tomato' ? 'font-medium' : undefined,
    }),
  });

  const tomato = document.getElementById('plant-tomato');
  expect(tomato?.tagName).toBe('TR');
  expect(tomato?.classList.contains('font-medium')).toBe(true);
  expect(document.getElementById('plant-basil')?.classList.contains('font-medium')).toBe(false);
  await expect.element(screen.getByRole('table', { name: 'Plants' })).toBeInTheDocument();
});

test('an activatable row keeps its hover tint alongside its own class', async () => {
  const screen = await render(TableFixture, {
    sortable: false,
    onSelect: vi.fn<(row: Row) => void>(),
    rowAttributes: () => ({ class: 'font-medium' }),
  });

  const row = screen.getByRole('button').nth(0);
  await expect.element(row).toHaveClass('hover:bg-base-200');
  await expect.element(row).toHaveClass('cursor-pointer');
  await expect.element(row).toHaveClass('font-medium');
});

test('headerClass styles the header only, so a header can be read but not seen', async () => {
  const screen = await render(TableFixture, {
    caption: 'Plants',
    sortable: false,
    headerClass: 'sr-only',
  });

  const header = screen.getByRole('columnheader', { name: 'Count' });
  await expect.element(header).toHaveClass('sr-only');
  for (const cell of screen.getByRole('cell').elements()) {
    expect(cell.classList.contains('sr-only')).toBe(false);
  }
});

// ── Selection ─────────────────────────────────────────────────────────────

/** The fixture's bound selection, as the caller holds it. */
const selectedKeys = (): string =>
  document.querySelector('[data-testid="selected"]')?.textContent ?? '';

test('multiple: a row checkbox, named by its first column, selects that row by key', async () => {
  const onSelectionChange = vi.fn<(selected: Set<string>) => void>();
  const screen = await render(TableFixture, {
    caption: 'Plants',
    sortable: false,
    selection: 'multiple',
    onSelectionChange,
  });

  const status = screen.getByRole('status');
  await expect.element(status).toHaveTextContent('');

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Tomato' }));

  await expect.element(screen.getByRole('checkbox', { name: 'Select Tomato' })).toBeChecked();
  expect(selectedKeys()).toBe('tomato');
  expect([...(onSelectionChange.mock.lastCall?.[0] ?? [])]).toEqual(['tomato']);
  // The live region was there before the change, so it is announced.
  await expect.element(status).toHaveTextContent('1 selected');
  // Not colour alone, but colour too.
  const row = screen.getByRole('row').nth(2);
  await expect.element(row).toHaveClass('bg-base-200');
  await expect.element(screen.getByRole('row').nth(1)).not.toHaveClass('bg-base-200');
  // A static table stays one: no grid, no aria-selected.
  expect(screen.getByRole('grid').elements()).toHaveLength(0);
  expect(document.querySelector('[aria-selected]')).toBeNull();
});

test('multiple: the selection column is a real first column, counted in the empty colspan', async () => {
  const screen = await render(TableFixture, { rows: [], selection: 'multiple' });

  expect(screen.getByRole('columnheader').elements()).toHaveLength(3);
  await expect
    .element(screen.getByRole('cell', { name: 'Nothing to show.' }))
    .toHaveAttribute('colspan', '3');
  await expect
    .element(screen.getByRole('checkbox', { name: 'Select all on this page' }))
    .toBeDisabled();
});

test('the header checkbox runs none → all, shows some as mixed, and clears from all', async () => {
  const screen = await render(TableFixture, { sortable: false, selection: 'multiple' });
  const all = screen.getByRole('checkbox', { name: 'Select all on this page' });
  await expect.element(all).not.toBeChecked();

  await userEvent.click(all);
  await expect.element(all).toBeChecked();
  expect(selectedKeys()).toBe('basil,tomato,garlic');

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Basil' }));
  await expect.element(all).toBePartiallyChecked();
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 selected');

  // From mixed, the header selects the rest of the page.
  await userEvent.click(all);
  await expect.element(all).toBeChecked();
  await expect.element(all).not.toBePartiallyChecked();

  await userEvent.click(all);
  await expect.element(all).not.toBeChecked();
  expect(selectedKeys()).toBe('');
});

test('select-all covers the rows in hand and keeps a selected key from another page', async () => {
  const screen = await render(TableFixture, {
    sortable: false,
    selection: 'multiple',
    rows: rows.slice(0, 2),
    initialSelected: ['garlic'],
  });

  const all = screen.getByRole('checkbox', { name: 'Select all on this page' });
  // Garlic is selected but not on this page: the page itself is unselected.
  await expect.element(all).not.toBeChecked();
  await expect.element(all).not.toBePartiallyChecked();
  await expect.element(screen.getByRole('status')).toHaveTextContent('1 selected');

  await userEvent.click(all);
  expect(selectedKeys()).toBe('garlic,basil,tomato');
  await userEvent.click(all);
  expect(selectedKeys()).toBe('garlic');
});

test('Space toggles a focused row checkbox', async () => {
  const screen = await render(TableFixture, { sortable: false, selection: 'multiple' });

  const basil = screen.getByRole('checkbox', { name: 'Select Basil' });
  await userEvent.tab();
  await expect
    .element(screen.getByRole('checkbox', { name: 'Select all on this page' }))
    .toHaveFocus();
  await userEvent.tab();
  await expect.element(basil).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect.element(basil).toBeChecked();
  expect(selectedKeys()).toBe('basil');
});

test('selecting never activates an activatable row, and activating never selects', async () => {
  const onSelect = vi.fn<(row: Row) => void>();
  const screen = await render(TableFixture, { sortable: false, selection: 'multiple', onSelect });

  const basil = screen.getByRole('checkbox', { name: 'Select Basil' });
  await userEvent.click(basil);
  await expect.element(basil).toBeChecked();
  basil.element().focus();
  await userEvent.keyboard(' ');
  await expect.element(basil).not.toBeChecked();
  expect(onSelect).not.toHaveBeenCalled();

  const tomatoRow = screen.getByRole('button').nth(1);
  await userEvent.click(tomatoRow);
  expect(onSelect).toHaveBeenLastCalledWith(rows[1]);
  const element = tomatoRow.element();
  if (element instanceof HTMLElement) element.focus();
  await userEvent.keyboard('{Enter}');
  expect(onSelect).toHaveBeenCalledTimes(2);
  expect(selectedKeys()).toBe('');
});

test('single: radios sharing one name, where choosing one clears the other', async () => {
  const screen = await render(TableFixture, { sortable: false, selection: 'single' });

  expect(screen.getByRole('checkbox').elements()).toHaveLength(0);
  const radios = screen.getByRole('radio').elements();
  expect(radios).toHaveLength(3);
  const groups = new Set(radios.map((radio) => radio.getAttribute('name')));
  expect(groups.size).toBe(1);
  await expect.element(screen.getByRole('columnheader', { name: 'Select' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('radio', { name: 'Select Basil' }));
  expect(selectedKeys()).toBe('basil');
  await userEvent.click(screen.getByRole('radio', { name: 'Select Garlic' }));
  expect(selectedKeys()).toBe('garlic');
  await expect.element(screen.getByRole('radio', { name: 'Select Basil' })).not.toBeChecked();
  await expect.element(screen.getByRole('radio', { name: 'Select Garlic' })).toBeChecked();
});

test('two single-select tables do not share a radio group', async () => {
  await render(TableFixture, { selection: 'single' });
  await render(TableFixture, { selection: 'single' });

  const groups = new Set(
    [...document.querySelectorAll('input[type="radio"]')].map((radio) =>
      radio.getAttribute('name'),
    ),
  );
  expect(groups.size).toBe(2);
});

test('bulk actions sit in a toolbar named by the count, only while something is selected', async () => {
  const onArchive = vi.fn<(selected: ReadonlySet<string>) => void>();
  const screen = await render(TableFixture, { sortable: false, selection: 'multiple', onArchive });

  expect(screen.getByRole('toolbar').elements()).toHaveLength(0);

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Basil' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Garlic' }));
  await expect.element(screen.getByRole('toolbar', { name: '2 selected' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
  expect([...(onArchive.mock.lastCall?.[0] ?? [])]).toEqual(['basil', 'garlic']);
  // The action cleared the selection, so the toolbar is gone and the count empty.
  expect(selectedKeys()).toBe('');
  expect(screen.getByRole('toolbar').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('status')).toHaveTextContent('');
});

test('takes every selection string as a prop', async () => {
  const screen = await render(TableFixture, {
    sortable: false,
    selection: 'multiple',
    selectAllLabel: 'Tout sélectionner',
    selectRowLabel: (row) => `Choisir ${row.name}`,
    selectedCountLabel: (count) => `${count} choisi(s)`,
  });

  await userEvent.click(screen.getByRole('checkbox', { name: 'Choisir Basil' }));
  await expect
    .element(screen.getByRole('checkbox', { name: 'Tout sélectionner' }))
    .toBePartiallyChecked();
  await expect.element(screen.getByRole('status')).toHaveTextContent('1 choisi(s)');
});

test('renders no selection column, count or toolbar by default', async () => {
  const screen = await render(TableFixture, { sortable: false });

  expect(screen.getByRole('checkbox').elements()).toHaveLength(0);
  expect(screen.getByRole('status').elements()).toHaveLength(0);
  expect(screen.getByRole('columnheader').elements()).toHaveLength(2);
});

// ── Column visibility ────────────────────────────────────────────────────

test('hiddenColumns removes the column’s header and cells, not just its paint', async () => {
  const screen = await render(TableFixture, { sortable: false, initialHidden: ['count'] });

  expect(screen.getByRole('columnheader').elements()).toHaveLength(1);
  expect(screen.getByRole('columnheader', { name: 'Count' }).elements()).toHaveLength(0);
  expect(screen.getByRole('cell').elements()).toHaveLength(3);
});

test('the first column cannot be hidden, even when hiddenColumns names it', async () => {
  const screen = await render(TableFixture, { sortable: false, initialHidden: ['name'] });

  await expect.element(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
});

test('defaultHidden hides a column while hiddenColumns is unset', async () => {
  const screen = await render(TableFixture, { sortable: false, defaultHidden: true });

  expect(screen.getByRole('columnheader', { name: 'Count' }).elements()).toHaveLength(0);
});

test('the columns menu hides and shows a column and updates the bound set', async () => {
  const screen = await render(TableFixture, {
    sortable: false,
    columnMenu: true,
    initialHidden: [],
  });
  const hiddenKeys = screen.getByTestId('hidden');

  await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
  await expect.element(screen.getByRole('menu', { name: 'Columns' })).toBeInTheDocument();
  // The first column is listed but cannot be unchecked.
  const name = screen.getByRole('menuitemcheckbox', { name: 'Name' });
  await expect.element(name).toHaveAttribute('aria-checked', 'true');
  await expect.element(name).toHaveAttribute('aria-disabled', 'true');

  const count = screen.getByRole('menuitemcheckbox', { name: 'Count' });
  await expect.element(count).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(count);

  await expect.element(hiddenKeys).toHaveTextContent('count');
  expect(screen.getByRole('columnheader', { name: 'Count' }).elements()).toHaveLength(0);
  expect(screen.getByRole('cell').elements()).toHaveLength(3);

  await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Count' }));
  await expect.element(hiddenKeys).toHaveTextContent('');
  await expect.element(screen.getByRole('columnheader', { name: 'Count' })).toBeInTheDocument();
});

test('the columns menu takes its label as a prop', async () => {
  const screen = await render(TableFixture, { columnMenu: true, columnMenuLabel: 'Colonnes' });

  await userEvent.click(screen.getByRole('button', { name: 'Colonnes' }));
  await expect.element(screen.getByRole('menu', { name: 'Colonnes' })).toBeInTheDocument();
});
