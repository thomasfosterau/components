import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FormErrors from '../../src/lib/forms/FormErrors.svelte';

test('each message is its own assertive alert', async () => {
  const screen = await render(FormErrors, {
    messages: ['That garden name is already taken.', 'Your session expired.'],
  });

  const alerts = screen.getByRole('alert').elements();
  expect(alerts).toHaveLength(2);
  await expect.element(screen.getByText('That garden name is already taken.')).toBeInTheDocument();
});

test('an empty list renders nothing', async () => {
  const screen = await render(FormErrors, { messages: [] });

  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});

test('an omitted list renders nothing', async () => {
  const screen = await render(FormErrors, {});

  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});

test('the tone is a prop, and error is the default', async () => {
  const screen = await render(FormErrors, { messages: ['Saved, but two photographs failed.'] });
  await expect.element(screen.getByRole('alert')).toHaveClass('alert-error');

  const warning = await render(FormErrors, {
    messages: ['Saved, but two photographs failed.'],
    tone: 'warning',
  });
  expect(
    warning
      .getByRole('alert')
      .elements()
      .some((el) => el.classList.contains('alert-warning')),
  ).toBe(true);
});
