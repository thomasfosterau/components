import { userEvent } from 'vite-plus/test/browser';
import type { SourceRead } from '../../src/index.ts';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImportReadOptions from '../../src/svelte/ImportReadOptions.svelte';
import { regionOf } from './fixtures.ts';

const table = regionOf(
  'Name,E-mail\nAda Lovelace,ada@example.com\nLin,lin@example.com\nNia,nia@example.com\n',
);

/** The text of each column header of the preview. */
const previewHeaders = (): readonly string[] =>
  Array.from(document.querySelectorAll('table thead th'), (th) => th.textContent?.trim() ?? '');

test('previews the first rows under their headers, numbered as in the file', async () => {
  const screen = await render(ImportReadOptions, {
    table,
    read: { headerRow: 0, skipRows: 0 },
    previewSize: 2,
  });

  const preview = screen.getByRole('table', { name: 'Preview of the first rows' });
  await expect.element(preview).toBeVisible();
  expect(previewHeaders()).toEqual(['Row', 'Name', 'E-mail']);
  await expect.element(screen.getByRole('rowheader', { name: '2' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Ada Lovelace' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: 'Nia' })).not.toBeInTheDocument();
  await expect.element(screen.getByRole('status')).toHaveTextContent('3 rows to import.');
});

test('turning the header off reads its row as data, under numbered columns', async () => {
  let read: SourceRead | undefined;
  const screen = await render(ImportReadOptions, {
    table,
    read: { headerRow: 0, skipRows: 0 },
    onReadChange: (next: SourceRead) => {
      read = next;
    },
  });

  const header = screen.getByRole('checkbox', { name: 'The first row is the header' });
  await expect.element(header).toBeChecked();
  await header.click();

  await expect.element(header).not.toBeChecked();
  expect(read).toEqual({ skipRows: 0 });
  await expect.element(screen.getByRole('status')).toHaveTextContent('4 rows to import.');
  expect(previewHeaders()).toEqual(['Row', 'Column 1', 'Column 2']);
  await expect.element(screen.getByRole('cell', { name: 'E-mail' })).toBeVisible();
});

test('skipping rows moves the header down, and keeps it on', async () => {
  let read: SourceRead | undefined;
  const screen = await render(ImportReadOptions, {
    table: regionOf('Exported on 1 May,\nName,E-mail\nAda Lovelace,ada@example.com\n'),
    read: { headerRow: 0, skipRows: 0 },
    onReadChange: (next: SourceRead) => {
      read = next;
    },
  });

  expect(previewHeaders()).toEqual(['Row', 'Exported on 1 May', 'Column 2']);
  const skip = screen.getByRole('spinbutton', { name: /^Rows to skip at the top/u });
  await expect
    .element(skip)
    .toHaveAccessibleDescription('Rows above the table, such as a title or a note.');
  await skip.fill('1');
  await userEvent.keyboard('{Enter}');

  expect(read).toEqual({ headerRow: 0, skipRows: 1 });
  await expect.poll(previewHeaders).toEqual(['Row', 'Name', 'E-mail']);
  await expect.element(screen.getByRole('status')).toHaveTextContent('1 row to import.');
  await expect.element(screen.getByRole('rowheader', { name: '3' })).toBeVisible();
});

test('a read that leaves no rows says so', async () => {
  const screen = await render(ImportReadOptions, {
    table,
    read: { headerRow: 0, skipRows: 4 },
  });

  await expect.element(screen.getByText('No rows to import.')).toBeVisible();
  await expect.element(screen.getByRole('status')).toHaveTextContent('0 rows to import.');
});
