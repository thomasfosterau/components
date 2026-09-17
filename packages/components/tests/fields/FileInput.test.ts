import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FileInput from '../../src/lib/fields/FileInput.svelte';
import { textFile } from './files.ts';

test('is a native file input carrying its accept list', async () => {
  const screen = await render(FileInput, {
    'aria-label': 'Attachment',
    accept: 'text/plain',
    'data-testid': 'file',
  });

  const input = screen.getByTestId('file');
  await expect.element(input).toHaveAttribute('type', 'file');
  await expect.element(input).toHaveAttribute('accept', 'text/plain');
});

test('choosing a file reports it through onSelect', async () => {
  const onSelect = vi.fn();
  const screen = await render(FileInput, {
    'aria-label': 'Attachment',
    onSelect,
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(textFile('notes.txt', 10));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect.mock.calls[0]?.[0]).toBeInstanceOf(File);
});

test('a file over maxBytes is refused, cleared from the control and explained', async () => {
  const onSelect = vi.fn();
  const screen = await render(FileInput, {
    'aria-label': 'Attachment',
    maxBytes: 16,
    tooLargeMessage: 'That file is larger than 16 bytes.',
    onSelect,
    'data-testid': 'file',
  });

  const input = screen.getByTestId('file');
  await input.upload(textFile('notes.txt', 64));

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('That file is larger than 16 bytes.');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveClass('file-input-error');
  expect((input.element() as HTMLInputElement).value).toBe('');
  expect(onSelect).toHaveBeenCalledWith(undefined);
});

test('the too-large message is one the input is described by', async () => {
  const screen = await render(FileInput, {
    'aria-label': 'Attachment',
    maxBytes: 16,
    describedBy: 'attachment-hint',
    'data-testid': 'file',
  });

  const input = screen.getByTestId('file');
  await input.upload(textFile('notes.txt', 64));

  const described = (input.element().getAttribute('aria-describedby') ?? '').split(' ');
  expect(described[0]).toBe('attachment-hint');
  expect(document.getElementById(described[1] ?? '')?.getAttribute('role')).toBe('alert');
});

test('a file within the cap leaves no alert behind', async () => {
  const screen = await render(FileInput, {
    'aria-label': 'Attachment',
    maxBytes: 1024,
    'data-testid': 'file',
  });

  await screen.getByTestId('file').upload(textFile('notes.txt', 10));

  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});
