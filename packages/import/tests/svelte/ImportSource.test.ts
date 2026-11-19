import type { ImportFile } from '../../src/svelte/index.ts';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImportSource from '../../src/svelte/ImportSource.svelte';
import { cleanCsv, fileOf, formats } from './fixtures.ts';

test('detects a CSV, announces it and shows the evidence', async () => {
  let source: ImportFile | undefined;
  const screen = await render(ImportSource, {
    formats,
    onSourceChange: (next: ImportFile | undefined) => {
      source = next;
    },
  });

  const input = screen.getByLabelText(/^File to import/u);
  await expect.element(input).toHaveAttribute('accept', '.csv,.tsv,.tab');
  await input.upload(cleanCsv());

  await expect.element(screen.getByRole('status')).toHaveTextContent('Detected CSV, 1 table.');
  await expect
    .element(screen.getByRole('combobox', { name: 'File format' }))
    .toHaveAccessibleDescription(expect.stringContaining('comma-separated fields'));
  expect(source?.format.id).toBe('csv');
  expect(source?.tables).toHaveLength(1);
});

test('lets the user override the detected format, and reads the file again', async () => {
  let source: ImportFile | undefined;
  const screen = await render(ImportSource, {
    formats,
    onSourceChange: (next: ImportFile | undefined) => {
      source = next;
    },
  });

  await screen
    .getByLabelText(/^File to import/u)
    .upload(fileOf('people.csv', 'Name\tEmail\nAda\tada@example.com\n'));
  await expect.element(screen.getByRole('status')).toHaveTextContent('Detected TSV, 1 table.');

  const picker = screen.getByRole('combobox', { name: 'File format' });
  await expect.element(picker).toHaveValue('tsv');
  await expect
    .element(picker)
    .toHaveAccessibleDescription(expect.stringContaining('tab-separated fields'));
  await picker.selectOptions('csv');

  await expect.element(screen.getByRole('status')).toHaveTextContent('Detected CSV, 1 table.');
  expect(source?.format.id).toBe('csv');
});

test('a file none of the formats recognises is a clear error', async () => {
  const screen = await render(ImportSource, { formats });

  await screen
    .getByLabelText(/^File to import/u)
    .upload(new File([new Uint8Array([0x50, 0x4b, 3, 4, 0, 0, 1])], 'book.csv'));

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('This file is not in a format this import accepts.');
});
