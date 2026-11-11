import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import Main from '../../src/lib/layout/Main.svelte';
import SkipLinkPage from './fixtures/SkipLinkPage.svelte';
import { createRawSnippet } from 'svelte';

const focusDocumentStart = (): void => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  // Reset the sequential focus starting point to the top of the document.
  const probe = document.createElement('button');
  document.body.prepend(probe);
  probe.focus();
  probe.remove();
};

test('the first Tab focuses the skip link, which then shows', async () => {
  const screen = await render(SkipLinkPage);
  focusDocumentStart();

  await userEvent.tab();
  const link = screen.getByRole('link', { name: 'Skip to main content' });
  await expect.element(link).toHaveFocus();
  await expect.element(link).toHaveClass('focus:not-sr-only');
  await expect.element(link).toHaveAttribute('href', '#main-content');
});

test('activating it moves focus to main, and the next Tab continues inside main', async () => {
  const screen = await render(SkipLinkPage);
  focusDocumentStart();

  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  const main = screen.getByRole('main');
  await expect.element(main).toHaveFocus();
  await expect.element(main).toHaveAttribute('tabindex', '-1');

  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'First link in main' })).toHaveFocus();
  await expect.element(main).not.toHaveAttribute('tabindex');
});

test('Main takes id="main-content" by default, and a section does not', async () => {
  const children = createRawSnippet(() => ({ render: () => '<p>Content</p>' }));
  const main = await render(Main, { children });
  await expect.element(main.getByRole('main')).toHaveAttribute('id', 'main-content');

  const section = await render(Main, { as: 'section', children, 'aria-label': 'Nested' });
  await expect.element(section.getByRole('region', { name: 'Nested' })).not.toHaveAttribute('id');
});

test('targets renders several links in order', async () => {
  const screen = await render(SkipLinkPage, { multiple: true });
  focusDocumentStart();

  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Skip to search' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByRole('main')).toHaveFocus();
});
