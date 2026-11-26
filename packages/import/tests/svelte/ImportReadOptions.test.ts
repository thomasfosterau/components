import { userEvent } from 'vite-plus/test/browser';
import * as Csv from '@thomasfosterau/effect-document/csv';
import type { SourceRead } from '../../src/index.ts';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImportReadOptions from '../../src/svelte/ImportReadOptions.svelte';
import type { ReaderChoice } from '../../src/svelte/session.ts';
import { regionOf, semicolonCsv, sourceOf, titledCsv } from './fixtures.ts';

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

test('a format without a reader factory offers no reader options', async () => {
  const source = sourceOf('contacts.csv', 'Name,E-mail\nAda,ada@example.com\n', Csv.format);
  const screen = await render(ImportReadOptions, {
    table: source.table,
    read: { headerRow: 0, skipRows: 0 },
    source,
  });

  await expect.element(screen.getByRole('table')).toBeVisible();
  await expect.element(screen.getByRole('combobox', { name: 'Separator' })).not.toBeInTheDocument();
  await expect
    .element(screen.getByRole('combobox', { name: 'Text encoding' }))
    .not.toBeInTheDocument();
  await expect
    .element(screen.getByRole('checkbox', { name: 'Rows may have different numbers of fields' }))
    .not.toBeInTheDocument();
});

test('a semicolon CSV read as one column is split by choosing the semicolon', async () => {
  const source = sourceOf('contacts.csv', semicolonCsv);
  let reader: ReaderChoice | undefined;
  const screen = await render(ImportReadOptions, {
    table: source.table,
    read: { headerRow: 0, skipRows: 0 },
    source,
    onReaderChange: (next: ReaderChoice) => {
      reader = next;
    },
  });

  expect(previewHeaders()).toEqual(['Row', 'Name;E-mail;Plan']);
  await expect
    .element(screen.getByRole('combobox', { name: 'Quote character' }))
    .not.toBeInTheDocument();
  await screen.getByRole('combobox', { name: 'Separator' }).selectOptions('Semicolon');

  await expect.poll(previewHeaders).toEqual(['Row', 'Name', 'E-mail', 'Plan']);
  expect(reader?.separator).toBe(';');
  await expect.element(screen.getByRole('cell', { name: 'ada@example.com' })).toBeVisible();
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 rows to import.');
  await expect.element(screen.getByRole('combobox', { name: 'Quote character' })).toHaveValue('"');
});

test('a title line narrower than the table needs ragged rows', async () => {
  const source = sourceOf('contacts.csv', titledCsv);
  const screen = await render(ImportReadOptions, {
    table: source.table,
    read: { headerRow: 0, skipRows: 1 },
    source,
  });

  const ragged = screen.getByRole('checkbox', {
    name: 'Rows may have different numbers of fields',
  });
  await expect.element(ragged).toBeChecked();
  expect(previewHeaders()).toEqual(['Row', 'Name', 'E-mail', 'Plan']);
  await ragged.click();

  await expect
    .element(screen.getByRole('alert'))
    .toMatchTextContent(/^The file could not be read with these options\. Row \d+ has 3 columns/u);
  await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
  await ragged.click();

  await expect.element(screen.getByRole('table')).toBeVisible();
  expect(previewHeaders()).toEqual(['Row', 'Name', 'E-mail', 'Plan']);
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 rows to import.');
});

test('a changed read previews a bounded read, and says the file has more', async () => {
  const rows = Array.from({ length: 20 }, (_, index) => `Person ${index},p${index}@example.com`);
  const source = sourceOf('people.csv', `Name,E-mail\n${rows.join('\n')}\n`);
  const screen = await render(ImportReadOptions, {
    table: source.table,
    read: { headerRow: 0, skipRows: 0 },
    source,
    previewRows: 5,
  });

  await expect.element(screen.getByRole('status')).toHaveTextContent('20 rows to import.');
  await screen.getByRole('checkbox', { name: 'Read numbers and true or false values' }).click();

  await expect.element(screen.getByRole('status')).toHaveTextContent('At least 4 rows to import.');
  await expect.element(screen.getByRole('cell', { name: 'Person 0' })).toBeVisible();
});
