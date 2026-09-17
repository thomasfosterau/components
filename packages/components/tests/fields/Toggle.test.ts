import { userEvent } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Toggle from '../../src/lib/fields/Toggle.svelte';

test('is a switch named by its label', async () => {
  const screen = await render(Toggle, { label: 'Email me a weekly summary' });

  const control = screen.getByRole('switch', { name: 'Email me a weekly summary' });
  await expect.element(control).toBeInTheDocument();
  await expect.element(control).not.toBeChecked();
});

test('the description is reached through aria-describedby, not folded into the name', async () => {
  const screen = await render(Toggle, {
    label: 'Notify this browser',
    description: 'Only this browser is registered.',
  });

  const control = screen.getByRole('switch');
  await expect.element(control).toHaveAccessibleName('Notify this browser');
  await expect.element(control).toHaveAccessibleDescription('Only this browser is registered.');
});

test('with no onChange it simply follows the click', async () => {
  const screen = await render(Toggle, { label: 'Email me a weekly summary' });

  const control = screen.getByRole('switch');
  await userEvent.click(control);
  await expect.element(control).toBeChecked();

  await userEvent.click(control);
  await expect.element(control).not.toBeChecked();
});

test('Space toggles it from the keyboard', async () => {
  const screen = await render(Toggle, { label: 'Email me a weekly summary' });

  await userEvent.tab();
  const control = screen.getByRole('switch');
  await expect.element(control).toHaveFocus();

  await userEvent.keyboard(' ');
  await expect.element(control).toBeChecked();
});

test('onChange is asked for the NEXT state', async () => {
  const onChange = vi.fn(() => true);
  const screen = await render(Toggle, { label: 'Notify this browser', onChange });

  await userEvent.click(screen.getByRole('switch'));

  expect(onChange).toHaveBeenCalledWith(true);
  await expect.element(screen.getByRole('switch')).toBeChecked();
});

test('an onChange that returns false leaves the switch OFF — no lying control', async () => {
  const onChange = vi.fn(async () => false);
  const screen = await render(Toggle, { label: 'Notify this browser', onChange });

  const control = screen.getByRole('switch');
  await userEvent.click(control);

  expect(onChange).toHaveBeenCalledWith(true);
  await expect.element(control).not.toBeChecked();
});

test('an onChange that refuses to turn OFF leaves the switch on', async () => {
  const onChange = vi.fn(async () => true);
  const screen = await render(Toggle, {
    label: 'Notify this browser',
    checked: true,
    onChange,
  });

  const control = screen.getByRole('switch');
  await userEvent.click(control);

  expect(onChange).toHaveBeenCalledWith(false);
  await expect.element(control).toBeChecked();
});

test('a thrown onChange is treated as a refusal', async () => {
  const onChange = vi.fn(() => {
    throw new Error('the stage has no keys');
  });
  const screen = await render(Toggle, { label: 'Notify this browser', onChange });

  const control = screen.getByRole('switch');
  await userEvent.click(control);

  await expect.element(control).not.toBeChecked();
});
