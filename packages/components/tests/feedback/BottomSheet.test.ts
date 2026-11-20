/**
 * `BottomSheet` — modal: Dialog's contract; non-modal: a named region over a
 * page that stays usable. The grabber is a slider over the detents, moved by
 * keys and by a real Playwright drag.
 *
 * Run at a phone viewport. The suite loads no CSS, so the panel is in the
 * document's flow rather than fixed; its height is an inline style, which is
 * what the size assertions read.
 */

import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import BottomSheetFixture from './fixtures/BottomSheetFixture.svelte';

beforeEach(async () => {
  await page.viewport(390, 844);
});

afterEach(async () => {
  await page.viewport(1280, 800);
});

const handle = () => page.getByRole('slider', { name: 'Resize sheet' });
const sheet = () => page.getByTestId('sheet');
const height = () => sheet().element().getBoundingClientRect().height;

/** A real drag from the grabber to near the sheet's own bottom edge: down by almost its full height. */
const dragDownToBottom = (): Promise<void> =>
  userEvent.dragAndDrop(handle(), sheet(), {
    sourcePosition: { x: 22, y: 22 },
    targetPosition: { x: 22, y: Math.floor(height()) - 4 },
  });

test('modal: a named dialog with focus inside, closed by Escape', async () => {
  await render(BottomSheetFixture, {});

  const dialog = page.getByRole('dialog', { name: 'Results' });
  await expect.element(dialog).toHaveAttribute('aria-modal', 'true');
  await expect.element(dialog).toHaveAccessibleDescription('Beds near you.');
  await expect.element(dialog).toHaveAttribute('data-testid', 'sheet');
  await expect.poll(() => dialog.element().contains(document.activeElement)).toBe(true);

  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(page.getByTestId('open')).toHaveTextContent('false');
});

test('modal: the close button is named and closes it', async () => {
  await render(BottomSheetFixture, {});

  await page.getByRole('button', { name: 'Close' }).click();

  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('non-modal: a named region, and the page behind it stays usable', async () => {
  const screen = await render(BottomSheetFixture, { modal: false });

  const region = screen.getByRole('region', { name: 'Results' });
  await expect.element(region).toHaveAccessibleDescription('Beds near you.');
  expect(page.getByRole('dialog').elements()).toHaveLength(0);

  await screen.getByRole('button', { name: 'Behind the sheet' }).click();
  await expect.element(screen.getByTestId('behind')).toHaveTextContent('1');
});

test('interactiveBelow: the page stays usable at that detent and turns modal above it', async () => {
  const screen = await render(BottomSheetFixture, { interactiveBelow: 0 });

  const dialog = page.getByRole('dialog', { name: 'Results' });
  await expect.element(dialog).not.toHaveAttribute('aria-modal');
  await screen.getByRole('button', { name: 'Behind the sheet' }).click();
  await expect.element(screen.getByTestId('behind')).toHaveTextContent('1');
  await expect.element(screen.getByTestId('open')).toHaveTextContent('true');
  expect(document.documentElement.style.overflow).not.toBe('hidden');

  handle().element().focus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(dialog).toHaveAttribute('aria-modal', 'true');
  expect(document.documentElement.style.overflow).toBe('hidden');

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(dialog).not.toHaveAttribute('aria-modal');
  expect(document.documentElement.style.overflow).not.toBe('hidden');

  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

test('interactiveBelow: focus can leave the sheet at an interactive detent', async () => {
  const screen = await render(BottomSheetFixture, { interactiveBelow: 0 });
  const behind = screen.getByRole('button', { name: 'Behind the sheet' }).element();

  behind.focus();
  await expect.poll(() => document.activeElement).toBe(behind);
  await expect.element(screen.getByTestId('open')).toHaveTextContent('true');
});

test('non-modal: Escape collapses to the lowest detent and does not close', async () => {
  const screen = await render(BottomSheetFixture, { modal: false });

  handle().element().focus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(screen.getByTestId('detent')).toHaveTextContent('1');

  await userEvent.keyboard('{Escape}');
  await expect.element(screen.getByTestId('detent')).toHaveTextContent('0');
  await expect.element(screen.getByRole('region', { name: 'Results' })).toBeInTheDocument();
});

test('non-modal: the close button shows only while dismissible', async () => {
  const screen = await render(BottomSheetFixture, { modal: false, dismissible: false });

  await expect.element(screen.getByRole('region', { name: 'Results' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Close' }).elements()).toHaveLength(0);
});

test('the grabber is a slider over the detents, moved by the arrows, Home and End', async () => {
  const screen = await render(BottomSheetFixture, {
    detents: [0.25, 0.5, 0.92],
    detentLabels: ['Peek', 'Half', 'Full'],
  });

  await expect.element(handle()).toHaveAttribute('aria-valuemin', '0');
  await expect.element(handle()).toHaveAttribute('aria-valuemax', '2');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '0');
  await expect.element(handle()).toHaveAttribute('aria-valuetext', 'Peek');
  const peek = height();
  expect(peek).toBeCloseTo(844 * 0.25, 0);

  handle().element().focus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '1');
  await expect.element(handle()).toHaveAttribute('aria-valuetext', 'Half');
  await expect.element(screen.getByTestId('detent')).toHaveTextContent('1');
  expect(height()).toBeGreaterThan(peek);

  await userEvent.keyboard('{End}');
  await expect.element(handle()).toHaveAttribute('aria-valuetext', 'Full');
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '2');

  await userEvent.keyboard('{Home}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '0');
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '0');
});

test('a content detent fits the content', async () => {
  await render(BottomSheetFixture, { modal: false, detents: ['content'], rows: 2 });

  // Two 40px rows, the body's padding and the header: far below the 92dvh cap.
  expect(height()).toBeLessThan(844 * 0.5);
  expect(sheet().element().style.maxHeight).toBe('92dvh');
});

test('dragging the grabber below half the lowest detent closes a dismissible sheet', async () => {
  const screen = await render(BottomSheetFixture, { modal: false });

  await dragDownToBottom();

  await expect.element(screen.getByTestId('open')).toHaveTextContent('false');
  expect(page.getByRole('region', { name: 'Results' }).elements()).toHaveLength(0);
});

test('the same drag snaps a non-dismissible sheet back to its lowest detent', async () => {
  const screen = await render(BottomSheetFixture, { modal: false, dismissible: false });
  const before = height();

  await dragDownToBottom();

  await expect.element(screen.getByTestId('open')).toHaveTextContent('true');
  await expect.element(screen.getByTestId('detent')).toHaveTextContent('0');
  expect(height()).toBeCloseTo(before, 0);
});

test('a release with no move between rests where the pointer let go', async () => {
  const screen = await render(BottomSheetFixture, { modal: false });
  const grabber = handle().element();
  const box = grabber.getBoundingClientRect();
  const at = (y: number) => ({
    pointerId: 1,
    button: 0,
    bubbles: true,
    clientX: box.left + 10,
    clientY: y,
  });

  // A synthetic pointer is not one the browser will capture.
  grabber.setPointerCapture = () => {};
  // A slow release (no flick) 400px above the press, with no pointermove dispatched.
  grabber.dispatchEvent(new PointerEvent('pointerdown', { ...at(box.top + 10), isPrimary: true }));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  grabber.dispatchEvent(new PointerEvent('pointerup', at(box.top + 10 - 400)));

  await expect.element(screen.getByTestId('detent')).toHaveTextContent('1');
});

test('dragging the grabber up rests the sheet at the next detent up', async () => {
  const screen = await render(BottomSheetFixture, { modal: false });

  await userEvent.dragAndDrop(handle(), screen.getByRole('button', { name: 'Behind the sheet' }), {
    sourcePosition: { x: 22, y: 22 },
    targetPosition: { x: 5, y: 5 },
  });

  await expect.element(screen.getByTestId('detent')).toHaveTextContent('1');
  await expect.element(handle()).toHaveAttribute('aria-valuenow', '1');
  expect(height()).toBeCloseTo(844 * 0.92, 0);
});
