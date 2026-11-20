import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImageCompareFixture from './fixtures/ImageCompareFixture.svelte';
import { instanceOf } from '../dom.ts';

test('is a named group holding a named divider slider at 50 and both named images', async () => {
  const screen = await render(ImageCompareFixture);

  await expect
    .element(screen.getByRole('group', { name: 'Bed 4, March and November' }))
    .toBeInTheDocument();
  const slider = screen.getByRole('slider', { name: 'Comparison position' });
  await expect.element(slider).toHaveAttribute('aria-valuenow', '50');
  await expect.element(slider).toHaveAttribute('aria-valuemin', '0');
  await expect.element(slider).toHaveAttribute('aria-valuemax', '100');
  await expect.element(slider).toHaveAttribute('aria-valuetext', '50% March');
  await expect.element(screen.getByRole('img', { name: 'Bed 4 in March' })).toBeInTheDocument();
  await expect.element(screen.getByRole('img', { name: 'Bed 4 in November' })).toBeInTheDocument();
});

test('arrows step by 1, Page keys by 10, Home and End reach the ends, and the bound value follows', async () => {
  const screen = await render(ImageCompareFixture);

  const slider = screen.getByRole('slider', { name: 'Comparison position' });
  const bound = screen.getByTestId('bound');
  instanceOf(slider.element(), HTMLElement).focus();

  await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '53');
  await expect.element(bound).toHaveTextContent('53');

  await userEvent.keyboard('{PageDown}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '43');

  await userEvent.keyboard('{End}');
  await expect.element(bound).toHaveTextContent('100');
  await userEvent.keyboard('{Home}');
  await expect.element(bound).toHaveTextContent('0');
});

test('valueText overrides the spoken value', async () => {
  const screen = await render(ImageCompareFixture, {
    valueText: (v: number) => `${v}% of March showing`,
  });

  await expect
    .element(screen.getByRole('slider', { name: 'Comparison position' }))
    .toHaveAttribute('aria-valuetext', '50% of March showing');
});

test('clips the leading image to the divider, from the right in RTL', async () => {
  const ltr = await render(ImageCompareFixture);
  const march = instanceOf(ltr.getByRole('img', { name: 'Bed 4 in March' }).element(), HTMLElement);
  expect(march.parentElement?.style.clipPath).toBe('inset(0px 50% 0px 0px)');
  await ltr.unmount();

  const rtl = await render(ImageCompareFixture, { dir: 'rtl' });
  const slider = rtl.getByRole('slider', { name: 'Comparison position' });
  instanceOf(slider.element(), HTMLElement).focus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '51');
  const marchRtl = instanceOf(
    rtl.getByRole('img', { name: 'Bed 4 in March' }).element(),
    HTMLElement,
  );
  expect(marchRtl.parentElement?.style.clipPath).toBe('inset(0px 0px 0px 49%)');
});

test('a pointer press on the frame moves the divider there', async () => {
  const screen = await render(ImageCompareFixture);

  const frame = screen.getByRole('group', { name: 'Bed 4, March and November' });
  const { width } = instanceOf(frame.element(), HTMLElement).getBoundingClientRect();
  await frame.click({ position: { x: width / 4, y: 100 } });
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('25');
  await expect
    .element(screen.getByRole('slider', { name: 'Comparison position' }))
    .toHaveAttribute('aria-valuenow', '25');
});
