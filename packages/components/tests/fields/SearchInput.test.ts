import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SearchInput from '../../src/lib/fields/SearchInput.svelte';

test('the label names the field even with nothing visible beside it', async () => {
  const screen = await render(SearchInput, { label: 'Search taxa' });

  const input = screen.getByRole('searchbox', { name: 'Search taxa' });
  await expect.element(input).toBeInTheDocument();
  await expect.element(input).toHaveAttribute('name', 'q');
});

test('onInput fires on every keystroke', async () => {
  const onInput = vi.fn();
  const screen = await render(SearchInput, { label: 'Search taxa', onInput });

  await userEvent.fill(screen.getByRole('searchbox'), 'rosa');

  expect(onInput).toHaveBeenCalled();
  expect(onInput.mock.calls.at(-1)?.[0]).toBe('rosa');
});

test('Enter submits the current text', async () => {
  const onSubmit = vi.fn();
  const screen = await render(SearchInput, { label: 'Search taxa', value: 'rosa', onSubmit });

  await userEvent.click(screen.getByRole('searchbox'));
  await userEvent.keyboard('{Enter}');

  expect(onSubmit).toHaveBeenCalledWith('rosa');
});

test('the clear button is labelled, empties the field and reports both callbacks', async () => {
  const onInput = vi.fn();
  const onClear = vi.fn();
  const screen = await render(SearchInput, {
    label: 'Search taxa',
    value: 'rosa',
    clearLabel: 'Clear the search',
    onInput,
    onClear,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Clear the search' }));

  await expect.element(screen.getByRole('searchbox')).toHaveValue('');
  expect(onInput).toHaveBeenLastCalledWith('');
  expect(onClear).toHaveBeenCalledTimes(1);
});

test('there is nothing to clear while the field is empty', async () => {
  const screen = await render(SearchInput, { label: 'Search taxa', value: '' });

  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('pending replaces the clear button with a spinner and does not rename the field', async () => {
  const screen = await render(SearchInput, {
    label: 'Search taxa',
    value: 'rosa',
    pending: true,
  });

  expect(screen.getByRole('button').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('searchbox')).toHaveAccessibleName('Search taxa');
});
