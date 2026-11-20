/**
 * `ListDetailLayout`: two labelled regions; the route's `showDetail` picks
 * the compact pane (by classes the suite cannot render, since it runs
 * without the Tailwind build, so they are pinned here); a compact Back link
 * through the context; and focus that follows a compact navigation in both
 * directions, but stays put from the breakpoint up.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ListDetailFixture from './fixtures/ListDetailFixture.svelte';

afterEach(async () => {
  await page.viewport(1280, 800);
});

test('two labelled regions, and the placeholder while nothing is selected', async () => {
  const screen = await render(ListDetailFixture, {});

  await expect.element(screen.getByRole('region', { name: 'List' })).toBeInTheDocument();
  await expect.element(screen.getByRole('region', { name: 'Details' })).toBeInTheDocument();
  await expect.element(screen.getByText('Choose a bed.')).toBeInTheDocument();
});

test('the compact pane follows showDetail', async () => {
  const list = await render(ListDetailFixture, { showDetail: false });
  await expect.element(list.getByRole('region', { name: 'List' })).toHaveClass('flex');
  await expect.element(list.getByRole('region', { name: 'Details' })).toHaveClass('hidden');
  await list.unmount();

  const detail = await render(ListDetailFixture, { showDetail: true });
  await expect.element(detail.getByRole('region', { name: 'List' })).toHaveClass('hidden');
  await expect.element(detail.getByRole('region', { name: 'Details' })).toHaveClass('flex');
  await expect.element(detail.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/beds');
});

test('on a compact screen, opening focuses the detail and Back focuses the item', async () => {
  await page.viewport(390, 800);
  const screen = await render(ListDetailFixture, {});

  await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  await expect.element(screen.getByRole('region', { name: 'Details' })).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  await expect.element(screen.getByRole('link', { name: 'Bed 4' })).toHaveFocus();
});

test('on a wide screen, selecting moves no focus', async () => {
  await page.viewport(1280, 800);
  const screen = await render(ListDetailFixture, {});

  const toggle = screen.getByRole('button', { name: 'Toggle' });
  await userEvent.click(toggle);
  await expect.element(toggle).toHaveFocus();
});

test('no handle unless resizable', async () => {
  const screen = await render(ListDetailFixture, {});

  expect(screen.getByRole('separator').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('region', { name: 'List' })).toHaveClass('lg:border-e');
});

test('resizable: a window-splitter handle that controls the list and sets listSize', async () => {
  const onListResize = vi.fn<(size: number) => void>();
  const screen = await render(ListDetailFixture, { resizable: true, listSize: 30, onListResize });

  const handle = screen.getByRole('separator', { name: 'Resize list' });
  await expect.element(handle).toHaveAttribute('aria-valuenow', '30');
  await expect.element(handle).toHaveAttribute('aria-valuemin', '15');
  await expect.element(handle).toHaveAttribute('aria-valuemax', '60');
  await expect.element(handle).toHaveAttribute('aria-orientation', 'vertical');
  // Hidden with the compact pane below the breakpoint (pinned by class: the suite has no CSS).
  await expect.element(handle).toHaveClass('hidden');
  await expect.element(handle).toHaveClass('lg:block');
  const list = screen.getByRole('region', { name: 'List' });
  await expect.element(handle).toHaveAttribute('aria-controls', list.element().id);
  await expect.element(list).not.toHaveClass('lg:border-e');

  handle.element().focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(handle).toHaveAttribute('aria-valuenow', '35');
  await expect.element(screen.getByTestId('list-size')).toHaveTextContent('35');
  expect(onListResize).toHaveBeenCalledExactlyOnceWith(35);
  expect(
    screen.container
      .querySelector<HTMLElement>('[style*="--list-width"]')
      ?.style.getPropertyValue('--list-width'),
  ).toBe('35%');

  await userEvent.keyboard('{End}');
  await expect.element(handle).toHaveAttribute('aria-valuenow', '60');
});

test('resizable: until listSize is set, the list keeps its listWidth token', async () => {
  const screen = await render(ListDetailFixture, { resizable: true });

  expect(
    screen.container
      .querySelector<HTMLElement>('[style*="--list-width"]')
      ?.style.getPropertyValue('--list-width'),
  ).toBe('24rem');
  await expect.element(screen.getByTestId('list-size')).toHaveTextContent('unset');
  await expect
    .element(screen.getByRole('separator', { name: 'Resize list' }))
    .toHaveAttribute('aria-valuenow');
});
