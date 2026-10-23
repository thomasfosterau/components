import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PasswordInput from '../../src/lib/fields/PasswordInput.svelte';
import PasswordInputFixture from './fixtures/PasswordInputFixture.svelte';

test('is a password field set up for a password manager to fill', async () => {
  const screen = await render(PasswordInputFixture, {});

  const input = screen.getByLabelText('Password');
  await expect.element(input).toHaveAttribute('type', 'password');
  await expect.element(input).toHaveAttribute('autocomplete', 'current-password');
});

test('purpose="new" asks for a new password, so a manager offers to generate one', async () => {
  const screen = await render(PasswordInputFixture, { purpose: 'new' });

  await expect
    .element(screen.getByLabelText('Password'))
    .toHaveAttribute('autocomplete', 'new-password');
});

test('the toggle is a pressed-state button that reveals the text without submitting', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(PasswordInputFixture, { onSubmitted });

  const toggle = screen.getByRole('button', { name: 'Show password' });
  await expect.element(toggle).toHaveAttribute('type', 'button');
  await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');

  await userEvent.click(toggle);
  await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect.element(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  await expect.element(toggle).toHaveFocus();
  expect(onSubmitted).not.toHaveBeenCalled();

  await userEvent.click(toggle);
  await expect.element(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
});

test('the selection survives the type flip', async () => {
  const screen = await render(PasswordInput, { 'aria-label': 'Password', value: 'abcdefgh' });

  const input = screen.getByLabelText('Password').element() as HTMLInputElement;
  input.focus();
  input.setSelectionRange(2, 5);
  await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

  await expect.element(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  await expect.poll(() => [input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
});

test('name, minlength and data attributes land on the input, class on the wrapper', async () => {
  const screen = await render(PasswordInputFixture, {});

  const input = screen.getByLabelText('Password');
  await expect.element(input).toHaveAttribute('name', 'password');
  await expect.element(input).toHaveAttribute('minlength', '12');
  await expect.element(input).toHaveAttribute('data-testid', 'password-input');
  expect(input.element().classList.contains('wrapper-class')).toBe(false);
  expect(input.element().parentElement?.classList.contains('wrapper-class')).toBe(true);
});

test('revealable={false} renders no toggle', async () => {
  const screen = await render(PasswordInputFixture, { revealable: false });

  expect(screen.getByRole('button', { name: 'Show password' }).elements()).toHaveLength(0);
});

test('submitting the form hides the password again', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(PasswordInputFixture, { onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
  await expect.element(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(onSubmitted).toHaveBeenCalledOnce();
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.get('password')).toBe('hunter2hunter2');
  await expect.element(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  await expect
    .element(screen.getByRole('button', { name: 'Show password' }))
    .toHaveAttribute('aria-pressed', 'false');
});

test('inside FormField the label names it, the hint describes it and errors mark it invalid', async () => {
  const screen = await render(PasswordInputFixture, { errors: ['Too short.'] });

  const input = screen.getByLabelText('Password');
  await expect.element(input).toHaveAccessibleName('Password');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveAccessibleDescription(/At least 12 characters\./);
});
