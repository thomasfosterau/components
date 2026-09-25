import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import TextInput from '../../src/lib/fields/TextInput.svelte';

test('is a native textbox that accepts typing', async () => {
  const screen = await render(TextInput, { 'aria-label': 'Scientific name', value: '' });

  const input = screen.getByRole('textbox', { name: 'Scientific name' });
  await userEvent.fill(input, 'Rosa canina');
  await expect.element(input).toHaveValue('Rosa canina');
});

test('the FieldControl wiring becomes aria-describedby and aria-invalid', async () => {
  const screen = await render(TextInput, {
    id: 'taxon-name',
    'aria-label': 'Scientific name',
    describedBy: 'taxon-name-hint taxon-name-error',
    invalid: true,
    required: true,
  });

  const input = screen.getByRole('textbox');
  await expect.element(input).toHaveAttribute('id', 'taxon-name');
  await expect
    .element(input)
    .toHaveAttribute('aria-describedby', 'taxon-name-hint taxon-name-error');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toBeRequired();
  await expect.element(input).toHaveClass('input-error');
});

test('a valid field carries neither attribute', async () => {
  const screen = await render(TextInput, { 'aria-label': 'Scientific name' });

  const input = screen.getByRole('textbox');
  await expect.element(input).not.toHaveAttribute('aria-invalid');
  await expect.element(input).not.toHaveAttribute('aria-describedby');
});

test('type and size pass through, and the caller’s class is merged last', async () => {
  const screen = await render(TextInput, {
    'aria-label': 'Email',
    type: 'email',
    size: 'sm',
    class: 'max-w-xs',
  });

  const input = screen.getByRole('textbox', { name: 'Email' });
  await expect.element(input).toHaveAttribute('type', 'email');
  await expect.element(input).toHaveClass('input-sm');
  await expect.element(input).toHaveClass('max-w-xs');
});

test('native attributes are not swallowed', async () => {
  const screen = await render(TextInput, {
    'aria-label': 'Scientific name',
    name: 'scientificName',
    autocomplete: 'off',
    maxlength: 120,
    'data-testid': 'name',
  });

  const input = screen.getByTestId('name');
  await expect.element(input).toHaveAttribute('name', 'scientificName');
  await expect.element(input).toHaveAttribute('maxlength', '120');
  await expect.element(input).toHaveAttribute('autocomplete', 'off');
});
