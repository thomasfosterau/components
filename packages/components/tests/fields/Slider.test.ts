import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Slider from '../../src/lib/fields/Slider.svelte';
import SliderFormFixture from './fixtures/SliderFormFixture.svelte';
import SliderLabelledFixture from './fixtures/SliderLabelledFixture.svelte';

test('is a named slider reporting its value and bounds', async () => {
  const screen = await render(Slider, { label: 'Hours of sun', min: 0, max: 12, value: 4 });

  const slider = screen.getByRole('slider', { name: 'Hours of sun' });
  await expect.element(slider).toHaveAttribute('aria-valuenow', '4');
  await expect.element(slider).toHaveAttribute('aria-valuemin', '0');
  await expect.element(slider).toHaveAttribute('aria-valuemax', '12');
});

test('ArrowRight steps by `step`, End jumps to max, and the bound value follows', async () => {
  const onCommit = vi.fn();
  const screen = await render(Slider, {
    label: 'Depth',
    min: 0,
    max: 20,
    step: 2,
    value: 4,
    onCommit,
  });

  const slider = screen.getByRole('slider', { name: 'Depth' });
  (slider.element() as HTMLElement).focus();

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '6');
  expect(onCommit).toHaveBeenLastCalledWith(6);

  await userEvent.keyboard('{End}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '20');
  expect(onCommit).toHaveBeenLastCalledWith(20);
});

test('Page Up and Page Down jump a tenth of the scale', async () => {
  const screen = await render(Slider, { label: 'Depth', min: 0, max: 100, value: 50 });

  const slider = screen.getByRole('slider', { name: 'Depth' });
  (slider.element() as HTMLElement).focus();
  await userEvent.keyboard('{PageUp}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '60');
  await userEvent.keyboard('{PageDown}{PageDown}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '40');
});

test('formatValue becomes aria-valuetext and the visible readout', async () => {
  const screen = await render(Slider, {
    label: 'Hours of sun',
    min: 0,
    max: 12,
    value: 4,
    formatValue: (v: number) => `${v} h`,
  });

  await expect
    .element(screen.getByRole('slider', { name: 'Hours of sun' }))
    .toHaveAttribute('aria-valuetext', '4 h');
  await expect.element(screen.getByText('4 h')).toBeVisible();
});

test('showValue={false} drops the readout but keeps aria-valuetext', async () => {
  const screen = await render(Slider, {
    label: 'Hours of sun',
    value: 4,
    showValue: false,
    formatValue: (v: number) => `${v} h`,
  });

  await expect.element(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '4 h');
  expect(screen.getByText('4 h').elements()).toHaveLength(0);
});

test('range mode names each thumb and never lets low pass high', async () => {
  const screen = await render(Slider, {
    type: 'multiple',
    label: 'Hours of sun',
    min: 0,
    max: 12,
    value: [5, 6],
  });

  const low = screen.getByRole('slider', { name: 'Hours of sun Minimum' });
  const high = screen.getByRole('slider', { name: 'Hours of sun Maximum' });
  await expect.element(low).toHaveAttribute('aria-valuenow', '5');
  await expect.element(high).toHaveAttribute('aria-valuenow', '6');

  (low.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

  const values = screen
    .getByRole('slider')
    .elements()
    .map((el) => Number(el.getAttribute('aria-valuenow')));
  expect(values).toHaveLength(2);
  expect(values[0]).toBeLessThanOrEqual(values[1] ?? Number.NaN);
});

test('Tab moves from the low thumb to the high one', async () => {
  const screen = await render(Slider, { type: 'multiple', label: 'Price', value: [10, 90] });

  await userEvent.tab();
  await expect.element(screen.getByRole('slider', { name: 'Price Minimum' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('slider', { name: 'Price Maximum' })).toHaveFocus();
});

test('labelId names the slider through aria-labelledby', async () => {
  const screen = await render(SliderLabelledFixture, {});

  await expect.element(screen.getByRole('slider', { name: 'Hours of sun' })).toBeInTheDocument();
});

test('labelId in range mode reads the label then the thumb', async () => {
  const screen = await render(SliderLabelledFixture, { range: true });

  await expect
    .element(screen.getByRole('slider', { name: 'Hours of sun Minimum' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('slider', { name: 'Hours of sun Maximum' }))
    .toBeInTheDocument();
});

test('inside FormField the hint describes it and errors mark it invalid', async () => {
  const screen = await render(SliderFormFixture, { errors: ['Too little sun.'] });

  const slider = screen.getByRole('slider');
  await expect.element(slider).toHaveAccessibleDescription(/Full sun is six hours or more\./);
  await expect.element(slider).toHaveAttribute('aria-invalid', 'true');
});

test('inside FormField the label names it, and a click on the label focuses it', async () => {
  const screen = await render(SliderFormFixture, {});

  const slider = screen.getByRole('slider', { name: 'Hours of sun' });
  await expect.element(slider).toBeInTheDocument();
  await screen.getByText('Hours of sun').click();
  await expect.element(slider).toHaveFocus();
});

test('inside FormField each range thumb reads the label then its own name', async () => {
  const screen = await render(SliderFormFixture, { range: true });

  await expect
    .element(screen.getByRole('slider', { name: 'Hours of sun Minimum' }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('slider', { name: 'Hours of sun Maximum' }))
    .toBeInTheDocument();
});

test('name posts one hidden input per thumb', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(SliderFormFixture, { range: true, onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSubmitted).toHaveBeenCalledOnce();
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('sun')).toEqual(['2', '6']);
});

test('onCommit fires once per key press', async () => {
  const onCommit = vi.fn();
  const screen = await render(Slider, { label: 'Depth', value: 10, onCommit });

  (screen.getByRole('slider').element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

  expect(onCommit).toHaveBeenCalledTimes(3);
  expect(onCommit).toHaveBeenLastCalledWith(13);
});

test('disabled takes every thumb out of the tab order', async () => {
  const screen = await render(Slider, { label: 'Depth', value: 10, disabled: true });

  await expect.element(screen.getByRole('slider')).toHaveAttribute('tabindex', '-1');
  await expect.element(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true');
});
