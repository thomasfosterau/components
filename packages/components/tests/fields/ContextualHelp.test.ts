import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ContextualHelpFixture from './fixtures/ContextualHelpFixture.svelte';

test('the trigger is named by its kind and the title, and starts closed', async () => {
  const screen = await render(ContextualHelpFixture);

  const trigger = screen.getByRole('button', { name: 'Information: Hardiness zone' });
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('the help variant and triggerLabel change the name', async () => {
  const help = await render(ContextualHelpFixture, { variant: 'help' });
  await expect
    .element(help.getByRole('button', { name: 'Help: Hardiness zone' }))
    .toBeInTheDocument();
  await help.unmount();

  const own = await render(ContextualHelpFixture, { triggerLabel: 'Más información' });
  await expect
    .element(own.getByRole('button', { name: 'Más información: Hardiness zone' }))
    .toBeInTheDocument();
});

test('Enter opens a dialog named by the title, with the link and focus inside', async () => {
  const screen = await render(ContextualHelpFixture);

  screen.getByRole('button', { name: 'Information: Hardiness zone' }).element().focus();
  await userEvent.keyboard('{Enter}');

  const dialog = screen.getByRole('dialog', { name: 'Hardiness zone' });
  await expect.element(dialog).toBeInTheDocument();
  await expect
    .element(dialog.getByRole('link', { name: 'Read about zones' }))
    .toHaveAttribute('href', 'https://example.com/zones');
  await expect.poll(() => dialog.element().contains(document.activeElement)).toBe(true);
});

test('Escape closes it and focus returns to the trigger', async () => {
  const screen = await render(ContextualHelpFixture);
  const trigger = screen.getByRole('button', { name: 'Information: Hardiness zone' });

  await trigger.click();
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
  await userEvent.keyboard('{Escape}');

  await expect.poll(() => screen.getByRole('dialog').elements()).toHaveLength(0);
  await expect.element(trigger).toHaveFocus();
});

test('hovering does not open it', async () => {
  const screen = await render(ContextualHelpFixture);

  await screen.getByRole('button', { name: 'Information: Hardiness zone' }).hover();
  await new Promise((resolve) => setTimeout(resolve, 300));

  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('the trigger is at least 24 by 24 pixels', async () => {
  const screen = await render(ContextualHelpFixture);

  const box = screen
    .getByRole('button', { name: 'Information: Hardiness zone' })
    .element()
    .getBoundingClientRect();
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
});
