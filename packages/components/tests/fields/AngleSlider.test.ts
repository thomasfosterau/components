/**
 * `AngleSlider`'s contract: a `slider` named by its label with degrees and
 * the compass point spelled out, the keys (with wrap), pointer angles in
 * both zero conventions, a drag across the 0° seam, snapping to marks,
 * one commit per drag, and the posted value.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { drag, press } from '../canvas/pointer.ts';
import AngleSliderFixture from './fixtures/AngleSliderFixture.svelte';

const side = 160;
const mid = side / 2;

test('is a slider named by the label, with degrees and the compass point as its text', async () => {
  const screen = await render(AngleSliderFixture, { value: 135, compass: true });

  const slider = screen.getByRole('slider', { name: 'Aspect' });
  await expect.element(slider).toHaveAttribute('aria-valuetext', '135 degrees, south-east');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '135');
  await expect.element(slider).toHaveAccessibleDescription('Which way the bed faces.');
  await expect.element(slider).not.toHaveAttribute('aria-orientation');
});

test('arrows step clockwise, End goes to max, and the value wraps past 359', async () => {
  const screen = await render(AngleSliderFixture, { value: 90 });

  const slider = screen.getByRole('slider');
  slider.element().focus();
  await userEvent.keyboard('{ArrowRight>45}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '135');
  await userEvent.keyboard('{PageDown}{ArrowLeft}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '119');
  await userEvent.keyboard('{End}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '360');
  await userEvent.keyboard('{Home}{ArrowLeft}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '359');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '0');
});

test('a part range clamps instead of wrapping', async () => {
  const screen = await render(AngleSliderFixture, { value: 179, min: 0, max: 180 });

  screen.getByRole('slider').element().focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('180');
});

test('pressing the dial at 3 o’clock sets 90 with north zero, and 0 with east zero', async () => {
  const north = await render(AngleSliderFixture, {});
  await press(north.getByTestId('dial'), { x: side - 4, y: mid });
  await expect.element(north.getByTestId('bound')).toHaveTextContent('90');
  await north.unmount();

  const east = await render(AngleSliderFixture, { zero: 'east', value: 45 });
  await press(east.getByTestId('dial'), { x: side - 4, y: mid });
  await expect.element(east.getByTestId('bound')).toHaveTextContent('0');
});

test('a drag across the 0° seam carries on round, and commits once', async () => {
  const onCommit = vi.fn<(value: number) => void>();
  const screen = await render(AngleSliderFixture, { onCommit });

  await drag(screen.getByTestId('dial'), { x: mid - 20, y: 4 }, { x: mid + 20, y: 4 });
  const value = Number(screen.getByTestId('bound').element().textContent);
  expect(value).toBeGreaterThan(0);
  expect(value).toBeLessThan(30);
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test('restrictToMarks snaps to the nearest mark, and keys move mark to mark', async () => {
  const marks = [{ value: 0 }, { value: 90 }, { value: 180 }, { value: 270 }];
  const screen = await render(AngleSliderFixture, { marks, restrictToMarks: true });

  await press(screen.getByTestId('dial'), { x: side - 10, y: mid + 30 });
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('90');
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('180');
});

test('posts the value', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(AngleSliderFixture, { value: 225, onSubmitted });

  await screen.getByRole('button', { name: 'Save' }).click();
  expect(onSubmitted.mock.calls[0]?.[0].get('aspect')).toBe('225');
});
