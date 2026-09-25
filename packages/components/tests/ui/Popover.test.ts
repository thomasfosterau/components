import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PopoverFixture from './fixtures/PopoverFixture.svelte';

test('the trigger announces the panel it opens', async () => {
  const screen = await render(PopoverFixture, {
    title: 'Filter observations',
    triggerLabel: 'Filters',
  });

  const trigger = screen.getByRole('button', { name: 'Filters' });
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');

  await userEvent.click(trigger);

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
});

test('the title becomes the panel’s accessible name', async () => {
  const screen = await render(PopoverFixture, {
    title: 'Filter observations',
    triggerLabel: 'Filters',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

  await expect
    .element(screen.getByRole('dialog', { name: 'Filter observations' }))
    .toBeInTheDocument();
});

test('the close button is labelled and closes the panel', async () => {
  const screen = await render(PopoverFixture, {
    title: 'Filter observations',
    triggerLabel: 'Filters',
    closeLabel: 'Close this panel',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
  await userEvent.click(screen.getByRole('button', { name: 'Close this panel' }));

  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('Escape closes it and returns focus to the trigger', async () => {
  const screen = await render(PopoverFixture, {
    title: 'Filter observations',
    triggerLabel: 'Filters',
  });

  const trigger = screen.getByRole('button', { name: 'Filters' });
  await userEvent.click(trigger);
  await expect.element(screen.getByRole('dialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
  await expect.element(trigger).toHaveFocus();
});
