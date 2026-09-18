import { userEvent } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FormActionsFixture from './fixtures/FormActionsFixture.svelte';

test('the submit control really submits the form', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(FormActionsFixture, { submitLabel: 'Create garden', onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Create garden' }));

  expect(onSubmitted).toHaveBeenCalledTimes(1);
});

test('Enter in a field submits too, because the button is type=submit', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(FormActionsFixture, { submitLabel: 'Create garden', onSubmitted });

  await userEvent.click(screen.getByRole('textbox', { name: 'Garden name' }));
  await userEvent.keyboard('{Enter}');

  expect(onSubmitted).toHaveBeenCalledTimes(1);
});

test('pending disables the button, marks it busy and swaps the label', async () => {
  const screen = await render(FormActionsFixture, {
    submitLabel: 'Create garden',
    pendingLabel: 'Creating…',
    pending: true,
  });

  const button = screen.getByRole('button', { name: 'Creating…' });
  await expect.element(button).toBeDisabled();
  await expect.element(button).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('button', { name: 'Create garden' }).elements()).toHaveLength(0);
});

test('disabled stops the submit without claiming anything is happening', async () => {
  const screen = await render(FormActionsFixture, {
    submitLabel: 'Create garden',
    disabled: true,
  });

  const button = screen.getByRole('button', { name: 'Create garden' });
  await expect.element(button).toBeDisabled();
  await expect.element(button).not.toHaveAttribute('aria-busy');
});

test('cancel is a link, so the destination is visible before it is taken', async () => {
  const screen = await render(FormActionsFixture, {
    submitLabel: 'Create garden',
    cancelHref: '/gardens',
    cancelLabel: 'Back to gardens',
  });

  await expect
    .element(screen.getByRole('link', { name: 'Back to gardens' }))
    .toHaveAttribute('href', '/gardens');
});

test('no cancelHref, no cancel control', async () => {
  const screen = await render(FormActionsFixture, { submitLabel: 'Save notes' });

  expect(screen.getByRole('link').elements()).toHaveLength(0);
});

test('extra controls render after cancel', async () => {
  const screen = await render(FormActionsFixture, {
    submitLabel: 'Publish',
    cancelHref: '/gardens',
    extra: true,
  });

  await expect.element(screen.getByRole('button', { name: 'Save as a draft' })).toBeInTheDocument();
});
