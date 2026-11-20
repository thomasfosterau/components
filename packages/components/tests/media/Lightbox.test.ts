import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import LightboxFixture from './fixtures/LightboxFixture.svelte';
import { instanceOf } from '../dom.ts';

const dialog = () => page.getByRole('dialog', { name: 'Image viewer' });
const shown = () => instanceOf(dialog().getByRole('img').element(), HTMLImageElement);
const live = () => instanceOf(document.querySelector('[aria-live="polite"]'), HTMLElement);

async function openThird(): Promise<void> {
  await render(LightboxFixture);
  await page.getByRole('button', { name: 'View Bed 3 in March' }).click();
  await expect.element(dialog()).toBeVisible();
}

test('thumbnails are named buttons in a list', async () => {
  await render(LightboxFixture);

  const list = page.getByRole('list', { name: 'Garden photos' });
  await expect.element(list).toBeInTheDocument();
  expect(list.getByRole('button').elements()).toHaveLength(5);
  await expect
    .element(list.getByRole('button', { name: 'View Bed 1 in March' }))
    .toBeInTheDocument();
});

test('a thumbnail opens the named dialog on its image, with focus inside and the position announced', async () => {
  await openThird();

  expect(dialog().element().contains(document.activeElement)).toBe(true);
  expect(shown().alt).toBe('Bed 3 in March');
  expect(live().textContent).toBe('Image 3 of 5: Bed 3 in March');
  await expect.element(dialog()).toHaveAccessibleDescription(/Image 3 of 5\s*Tomatoes staked/);
});

test('arrows move between images, End reaches the last, and Next is then disabled', async () => {
  await openThird();

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(page.getByTestId('index')).toHaveTextContent('3');
  expect(live().textContent).toBe('Image 4 of 5: Bed 4 in March');

  await userEvent.keyboard('{End}');
  await expect.element(page.getByTestId('index')).toHaveTextContent('4');
  await expect.element(page.getByRole('button', { name: 'Next image' })).toBeDisabled();
  await userEvent.keyboard('{Home}');
  await expect.element(page.getByRole('button', { name: 'Previous image' })).toBeDisabled();
});

test('loop wraps from the last image to the first', async () => {
  await render(LightboxFixture, { loop: true });
  await page.getByRole('button', { name: 'View Bed 5 in March' }).click();

  await expect.element(page.getByRole('button', { name: 'Next image' })).toBeEnabled();
  await page.getByRole('button', { name: 'Next image' }).click();
  await expect.element(page.getByTestId('index')).toHaveTextContent('0');
});

test('in RTL, ArrowLeft moves forward', async () => {
  await render(LightboxFixture, { dir: 'rtl' });
  await page.getByRole('button', { name: 'View Bed 3 in March' }).click();

  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(page.getByTestId('index')).toHaveTextContent('3');
});

test('zooming in twice scales 2×, arrows then pan instead of navigating, and 0 resets', async () => {
  await openThird();

  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  await zoomIn.click();
  await zoomIn.click();
  await expect.poll(() => shown().style.transform).toContain('scale(2)');

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(page.getByTestId('index')).toHaveTextContent('2');
  await expect.poll(() => shown().style.transform).toMatch(/^translate\(-40px, 0px\)/);

  await userEvent.keyboard('0');
  await expect.poll(() => shown().style.transform).toBe('translate(0px, 0px) scale(1)');
});

test('Escape resets the zoom first, then closes and returns focus to the thumbnail', async () => {
  await openThird();

  await userEvent.keyboard('+');
  await expect.poll(() => shown().style.transform).toContain('scale(1.5)');
  await userEvent.keyboard('{Escape}');
  await expect.element(dialog()).toBeVisible();
  await expect.poll(() => shown().style.transform).toContain('scale(1)');

  await userEvent.keyboard('{Escape}');
  await expect.element(dialog()).not.toBeInTheDocument();
  await expect.element(page.getByTestId('index')).toHaveTextContent('closed');
  await expect.element(page.getByRole('button', { name: 'View Bed 3 in March' })).toHaveFocus();
});

test('a double-click toggles 2× zoom', async () => {
  await openThird();

  const stage = instanceOf(document.querySelector('[data-lightbox-stage]'), HTMLElement);
  await page.elementLocator(stage).dblClick();
  await expect.poll(() => shown().style.transform).toContain('scale(2)');
  await page.elementLocator(stage).dblClick();
  await expect.poll(() => shown().style.transform).toContain('scale(1)');
});

test('every image has non-empty alt text', async () => {
  await openThird();

  for (let step = 0; step < 5; step += 1) {
    expect(shown().alt.trim()).not.toBe('');
    await userEvent.keyboard('{ArrowRight}');
  }
});
