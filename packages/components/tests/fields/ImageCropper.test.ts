import { userEvent, type Locator } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImageCropperFixture from './fixtures/ImageCropperFixture.svelte';

const picture = async (width: number, height: number): Promise<Blob> => {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#3a7';
    context.fillRect(0, 0, width, height);
  }
  return canvas.convertToBlob({ type: 'image/png' });
};

const focus = (locator: Locator): void => {
  const element = locator.element();
  if (element instanceof HTMLElement) {
    element.focus();
  }
};

const setup = async (props: { aspect?: number; straighten?: boolean } = {}) => {
  const screen = await render(ImageCropperFixture, { src: await picture(1200, 800), ...props });
  const area = screen.getByTestId('area');
  await expect.element(area).toHaveTextContent('200,0,800,800,0');
  return { screen, area };
};

test('the frame is a named, described crop-area group, centred and fully covered at first', async () => {
  const { screen } = await setup();

  const frame = screen.getByRole('group', { name: 'Crop area' });
  await expect.element(frame).toHaveAttribute('aria-roledescription', 'crop area');
  await expect.element(frame).toHaveAccessibleDescription(/arrow keys/);
});

test('arrow keys pan within the image, and the readout follows', async () => {
  const { screen, area } = await setup();
  const frame = screen.getByRole('group', { name: 'Crop area' });

  focus(frame);
  for (let press = 0; press < 30; press += 1) {
    await userEvent.keyboard('{ArrowLeft}');
  }
  await expect.element(area).toHaveTextContent('0,0,800,800,0');
  await expect
    .element(frame.getByRole('status'))
    .toHaveTextContent('Showing 67% of the width, towards the left');
});

test('plus zooms in about the centre and Home resets', async () => {
  const { screen, area } = await setup();

  focus(screen.getByRole('group', { name: 'Crop area' }));
  await userEvent.keyboard('+');
  await expect.element(area).toHaveTextContent('236,36,727,727,0');
  await userEvent.keyboard('{Home}');
  await expect.element(area).toHaveTextContent('200,0,800,800,0');
});

test('the zoom slider at its top sets the crop to a quarter of the width', async () => {
  const { screen, area } = await setup();
  const zoom = screen.getByRole('slider', { name: 'Zoom' });

  await expect.element(zoom).toHaveAttribute('aria-valuetext', '100%');
  focus(zoom);
  await userEvent.keyboard('{End}');
  await expect.element(zoom).toHaveAttribute('aria-valuetext', '400%');
  await expect.element(area).toHaveTextContent('500,300,200,200,0');
});

test('rotate turns the image a quarter and swaps its dimensions', async () => {
  const { screen, area } = await setup();

  await userEvent.click(screen.getByRole('button', { name: 'Rotate 90°' }));
  await expect.element(area).toHaveTextContent('0,200,800,800,90');
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
  await expect.element(area).toHaveTextContent('200,0,800,800,0');
});

test('straightening shrinks the crop so the image still covers it', async () => {
  const { screen, area } = await setup({ straighten: true });
  const slider = screen.getByRole('slider', { name: 'Straighten' });

  await expect.element(slider).toHaveAttribute('aria-valuetext', 'Level');
  focus(slider);
  await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
  await expect.element(slider).toHaveAttribute('aria-valuetext', '3 degrees clockwise');
  await expect.element(area).toHaveTextContent('219,19,761,761,0');
});

test('a wider aspect frames a wider crop', async () => {
  const screen = await render(ImageCropperFixture, {
    src: await picture(1200, 800),
    aspect: 16 / 9,
  });
  await expect.element(screen.getByTestId('area')).toHaveTextContent('0,63,1200,675,0');
});

test('the api exports the crop at the requested type and size', async () => {
  const { screen } = await setup();

  await userEvent.click(screen.getByRole('button', { name: 'Export' }));
  await expect.element(screen.getByTestId('exported')).toHaveTextContent('image/webp 256x256');
});
