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

test('prefix and suffix are text in the description, never in the value', async () => {
  const screen = await render(TextInput, {
    'aria-label': 'Website',
    name: 'website',
    prefix: 'https://',
    suffix: '.example.org',
    describedBy: 'website-hint',
  });

  const input = screen.getByRole('textbox', { name: 'Website' });
  await expect.element(input).toHaveAccessibleDescription(/https:\/\/.*\.example\.org/);
  const describedBy = input.element().getAttribute('aria-describedby') ?? '';
  expect(describedBy.split(' ')[0]).toBe('website-hint');

  await userEvent.fill(input, 'garden');
  const form = document.createElement('form');
  const host = input.element().closest('div');
  expect(host).not.toBeNull();
  form.append(host!.cloneNode(true));
  expect([...new FormData(form).entries()]).toEqual([['website', 'garden']]);
});

test('a pointer press on the prefix focuses the input', async () => {
  const screen = await render(TextInput, { 'aria-label': 'Price', prefix: '$' });

  await screen.getByText('$').click();
  await expect.element(screen.getByRole('textbox', { name: 'Price' })).toHaveFocus();
});

test('with decorations, the wrapper takes the box classes and the caller class', async () => {
  const screen = await render(TextInput, {
    'aria-label': 'Weight',
    suffix: 'kg',
    invalid: true,
    class: 'mine',
  });

  const wrapper = screen.getByRole('textbox').element().parentElement;
  expect(wrapper?.classList.contains('input')).toBe(true);
  expect(wrapper?.classList.contains('input-error')).toBe(true);
  expect(wrapper?.classList.contains('mine')).toBe(true);
  await expect.element(screen.getByRole('textbox')).not.toHaveClass('input');
});

test('showCount shows "n / max" in the description and announces once per threshold', async () => {
  // Thresholds 5, 2 and 0: the default (10 at this length) would speak at 12 already.
  const screen = await render(TextInput, {
    'aria-label': 'Title',
    maxlength: 20,
    showCount: true,
    countWarnAt: 5,
  });
  const input = screen.getByRole('textbox', { name: 'Title' });
  const live = (): string =>
    screen.container.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';

  await userEvent.fill(input, 'a'.repeat(12));
  await expect.element(input).toHaveAccessibleDescription('12 / 20');
  expect(live()).toBe('');

  await userEvent.fill(input, 'a'.repeat(18));
  await expect.element(input).toHaveAccessibleDescription('18 / 20');
  expect(live()).toBe('2 characters left');

  await userEvent.fill(input, 'a'.repeat(19));
  expect(live()).toBe('2 characters left');

  await userEvent.fill(input, 'a'.repeat(20));
  await expect.element(input).toHaveAccessibleDescription('20 / 20');
  expect(live()).toBe('0 characters left');
  await expect.element(screen.getByText('20 / 20')).toHaveClass('text-error');
});

test('showCount without maxlength draws no counter', async () => {
  const screen = await render(TextInput, { 'aria-label': 'Title', showCount: true });

  await expect.element(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
});

test('countWarnAt defaults to 10 characters left', async () => {
  const screen = await render(TextInput, { 'aria-label': 'Title', maxlength: 20, showCount: true });

  await userEvent.fill(screen.getByRole('textbox'), 'a'.repeat(9));
  expect(screen.container.querySelector('[aria-live="polite"]')?.textContent?.trim()).toBe('');
  await userEvent.fill(screen.getByRole('textbox'), 'a'.repeat(10));
  await expect
    .poll(() => screen.container.querySelector('[aria-live="polite"]')?.textContent?.trim())
    .toBe('10 characters left');
});
