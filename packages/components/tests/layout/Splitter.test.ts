/**
 * `Splitter`: the APG window splitter. The separator's role, name, value range,
 * orientation and `aria-controls` are its contract; arrow keys, Home/End and
 * Enter move it; a real pointer drag moves `size` live and commits once.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { At } from '../canvas/pointer.ts';
import SplitterFixture from './fixtures/SplitterFixture.svelte';

const handle = () => page.getByRole('separator', { name: 'Resize panes' });

test('the handle is a named, focusable separator that controls the leading pane', async () => {
  await render(SplitterFixture, {});

  const separator = handle();
  await expect.element(separator).toHaveAttribute('aria-valuenow', '50');
  await expect.element(separator).toHaveAttribute('aria-valuemin', '10');
  await expect.element(separator).toHaveAttribute('aria-valuemax', '90');
  await expect.element(separator).toHaveAttribute('aria-orientation', 'vertical');
  await expect.element(separator).toHaveAttribute('tabindex', '0');

  const controlled = document.getElementById(
    separator.element().getAttribute('aria-controls') ?? '',
  );
  expect(controlled).toHaveTextContent('Bed list');
});

test('handleLabel names the handle, and native attributes reach the container', async () => {
  const screen = await render(SplitterFixture, { handleLabel: 'Resize properties panel' });

  await expect
    .element(screen.getByRole('separator', { name: 'Resize properties panel' }))
    .toBeInTheDocument();
  await expect.element(screen.getByTestId('splitter')).toHaveStyle({ height: '400px' });
});

test('arrow keys move the divider by step, bind size and commit once per press', async () => {
  const onCommit = vi.fn<(size: number) => void>();
  const screen = await render(SplitterFixture, { onCommit });

  handle().element().focus();
  await userEvent.keyboard('{ArrowRight}');

  await expect.element(handle()).toHaveAttribute('aria-valuenow', '55');
  await expect.element(screen.getByTestId('size')).toHaveTextContent('55');
  expect(onCommit).toHaveBeenCalledExactlyOnceWith(55);

  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '45');
  expect(onCommit).toHaveBeenCalledTimes(3);
});

test('Home and End jump to the limits, and the value never leaves the range', async () => {
  const onCommit = vi.fn<(size: number) => void>();
  await render(SplitterFixture, { minSize: 20, maxSize: 80, onCommit });

  handle().element().focus();
  await userEvent.keyboard('{Home}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '20');
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '20');

  await userEvent.keyboard('{End}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '80');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '80');

  // A press that changes nothing commits nothing.
  expect(onCommit.mock.calls).toEqual([[20], [80]]);
});

test('collapsible: Enter collapses the leading pane to 0 and restores it', async () => {
  const screen = await render(SplitterFixture, { size: 35, collapsible: true });

  await expect.element(handle()).toHaveAttribute('aria-valuemin', '0');
  handle().element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '0');
  await expect.element(screen.getByTestId('size')).toHaveTextContent('0');

  await userEvent.keyboard('{Enter}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '35');
});

test('Enter does nothing unless collapsible', async () => {
  await render(SplitterFixture, {});

  handle().element().focus();
  await userEvent.keyboard('{Enter}');

  await expect.element(handle()).toHaveAttribute('aria-valuenow', '50');
});

test('vertical: a horizontal separator moved by the up and down arrows', async () => {
  await render(SplitterFixture, { orientation: 'vertical' });

  await expect.element(handle()).toHaveAttribute('aria-orientation', 'horizontal');
  handle().element().focus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '55');
  await userEvent.keyboard('{ArrowUp}{ArrowUp}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '45');
});

test('rtl: the left arrow grows the leading (right-hand) pane', async () => {
  await render(SplitterFixture, { dir: 'rtl' });

  handle().element().focus();
  await userEvent.keyboard('{ArrowLeft}');

  await expect.element(handle()).toHaveAttribute('aria-valuenow', '55');
});

test('dragging the handle a quarter of the way moves size by 25 and commits once, on release', async () => {
  const onCommit = vi.fn<(size: number) => void>();
  const screen = await render(SplitterFixture, { onCommit });
  const container = screen.getByTestId('splitter');

  // A fresh target position per call: the locator mutates the object it is given.
  const from: At = { x: 2, y: 200 };
  const to: At = { x: 100, y: 200 };
  await userEvent.dragAndDrop(handle(), container, {
    sourcePosition: { ...from },
    targetPosition: { ...to },
  });

  await expect.element(handle()).toHaveAttribute('aria-valuenow', '25');
  expect(onCommit).toHaveBeenCalledOnce();
  expect(onCommit.mock.calls[0]?.[0]).toBeCloseTo(25, 0);
});
