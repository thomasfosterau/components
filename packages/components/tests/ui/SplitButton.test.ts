import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SplitButtonFixture from './fixtures/SplitButtonFixture.svelte';

test('the main part runs the default action and opens no menu', async () => {
  const onSave = vi.fn<() => void>();
  const screen = await render(SplitButtonFixture, { onSave });

  await screen.getByRole('button', { name: 'Save', exact: true }).click();

  expect(onSave).toHaveBeenCalledOnce();
  expect(screen.getByRole('menu').elements()).toHaveLength(0);
});

test('the chevron is a named menu button that opens on Enter', async () => {
  const screen = await render(SplitButtonFixture);

  const chevron = screen.getByRole('button', { name: 'More save options' });
  await expect.element(chevron).toHaveAttribute('aria-haspopup', 'menu');
  await expect.element(chevron).toHaveAttribute('aria-expanded', 'false');

  chevron.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByRole('menu', { name: 'More save options' })).toBeInTheDocument();
  await expect.element(screen.getByRole('menuitem', { name: 'Save as draft' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('menuitem', { name: 'Save and publish' })).toHaveFocus();
});

test('choosing an alternative runs it, closes the menu and focuses the chevron', async () => {
  const onDraft = vi.fn<() => void>();
  const screen = await render(SplitButtonFixture, { onDraft });
  const chevron = screen.getByRole('button', { name: 'More save options' });

  await chevron.click();
  await screen.getByRole('menuitem', { name: 'Save as draft' }).click();

  expect(onDraft).toHaveBeenCalledOnce();
  await expect.poll(() => screen.getByRole('menu').elements()).toHaveLength(0);
  await expect.element(chevron).toHaveFocus();
});

test('Tab goes main part, chevron, next element; the group has no name', async () => {
  const screen = await render(SplitButtonFixture);

  await expect.element(screen.getByRole('group')).not.toHaveAttribute('aria-label');
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Save', exact: true })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'More save options' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
});

test('primaryDisabled disables only the main part', async () => {
  const screen = await render(SplitButtonFixture, { primaryDisabled: true });

  await expect.element(screen.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await expect.element(screen.getByRole('button', { name: 'More save options' })).toBeEnabled();
});

test('loading marks the main part busy and keeps its name', async () => {
  const screen = await render(SplitButtonFixture, { loading: true });

  await expect
    .element(screen.getByRole('button', { name: 'Save', exact: true }))
    .toHaveAttribute('aria-busy', 'true');
});
