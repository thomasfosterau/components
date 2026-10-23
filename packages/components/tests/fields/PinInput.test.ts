import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PinInput from '../../src/lib/fields/PinInput.svelte';
import PinInputFormFixture from './fixtures/PinInputFormFixture.svelte';

test('is one textbox named by the FormField label, set up for one-time codes', async () => {
  const screen = await render(PinInputFormFixture, {});

  const input = screen.getByLabelText('Sign-in code');
  await expect.element(input).toHaveRole('textbox');
  await expect.element(input).toHaveAttribute('autocomplete', 'one-time-code');
  await expect.element(input).toHaveAttribute('inputmode', 'numeric');
  await expect.element(input).toHaveAttribute('maxlength', '6');
  expect(screen.getByRole('textbox').elements()).toHaveLength(1);
});

test('typing the code binds it and calls onComplete exactly once', async () => {
  const onComplete = vi.fn();
  const screen = await render(PinInputFormFixture, { onComplete });

  await userEvent.click(screen.getByLabelText('Sign-in code'));
  await userEvent.keyboard('123456');

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('123456');
  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  expect(onComplete).toHaveBeenCalledWith('123456');
});

test('pasting "123 456" yields 123456', async () => {
  const screen = await render(PinInputFormFixture, {});

  const input = screen.getByLabelText('Sign-in code');
  await userEvent.click(input);
  const data = new DataTransfer();
  data.setData('text/plain', '123 456');
  input
    .element()
    .dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('123456');
});

test('letters are rejected under the numeric charset', async () => {
  const screen = await render(PinInputFormFixture, {});

  await userEvent.click(screen.getByLabelText('Sign-in code'));
  await userEvent.keyboard('1a2');

  await expect.element(screen.getByLabelText('Sign-in code')).toHaveValue('12');
});

test('the alphanumeric charset accepts letters and asks for a text keyboard', async () => {
  const screen = await render(PinInputFormFixture, { charset: 'alphanumeric' });

  const input = screen.getByLabelText('Sign-in code');
  await expect.element(input).toHaveAttribute('inputmode', 'text');
  await userEvent.click(input);
  await userEvent.keyboard('ab12');
  await expect.element(input).toHaveValue('ab12');
});

test('the cells are aria-hidden and nothing in them is focusable', async () => {
  const screen = await render(PinInput, { 'aria-label': 'Code', length: 4 });

  const cells = screen.container.querySelectorAll('[data-pin-input-cell]');
  expect(cells).toHaveLength(4);
  for (const cell of cells) {
    expect(cell.getAttribute('aria-hidden')).toBe('true');
    expect(cell.querySelector('[tabindex], input, button')).toBeNull();
  }
});

test('masked shows a bullet in each filled cell, never the character', async () => {
  const screen = await render(PinInput, {
    'aria-label': 'PIN',
    length: 4,
    masked: true,
    value: '12',
  });

  const cells = [...screen.container.querySelectorAll('[data-pin-input-cell]')];
  expect(cells.map((cell) => cell.textContent?.trim())).toEqual(['•', '•', '', '']);
});

test('inside FormField the hint describes it and errors mark it invalid', async () => {
  const screen = await render(PinInputFormFixture, { errors: ['That code has expired.'] });

  const input = screen.getByLabelText('Sign-in code');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveAccessibleDescription(/We emailed you a six-digit code\./);
});

test('name posts the full code from a wrapping form', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(PinInputFormFixture, { onSubmitted });

  await userEvent.click(screen.getByLabelText('Sign-in code'));
  await userEvent.keyboard('654321');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(onSubmitted).toHaveBeenCalledOnce();
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.get('code')).toBe('654321');
});
