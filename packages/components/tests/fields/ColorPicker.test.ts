import { page, userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ColorPicker from '../../src/lib/fields/ColorPicker.svelte';
import ColorPickerFixture from './fixtures/ColorPickerFixture.svelte';
import { instanceOf } from '../dom.ts';

const focus = (locator: { element: () => Element }): void => {
  instanceOf(locator.element(), HTMLElement).focus();
};

test('the trigger is named by the FormField label and described by the colour name', async () => {
  await render(ColorPickerFixture);

  const trigger = page.getByRole('button', { name: 'Bed colour' });
  await expect.element(trigger).toHaveAccessibleDescription('Leaf green');
});

test('outside a FormField, triggerLabel names the trigger and the hex describes a colour no swatch matches', async () => {
  await render(ColorPicker, { value: 'rgb(255 0 0)' });

  await expect
    .element(page.getByRole('button', { name: 'Choose colour' }))
    .toHaveAccessibleDescription('#ff0000');
});

test('arrow keys pick a swatch, and closing commits once', async () => {
  const onCommit = vi.fn<(value: string) => void>();
  await render(ColorPickerFixture, { onCommit });

  await page.getByRole('button', { name: 'Bed colour' }).click();
  const group = page.getByRole('radiogroup', { name: 'Swatches' });
  await expect.element(group).toBeVisible();
  focus(page.getByRole('radio', { name: 'Leaf green' }));
  await userEvent.keyboard('{ArrowRight}');
  await expect
    .element(page.getByRole('radio', { name: 'Sunflower' }))
    .toHaveAttribute('aria-checked', 'true');
  await expect.element(page.getByTestId('bound')).toHaveTextContent('#ffeb3b');
  expect(onCommit).not.toHaveBeenCalled();

  await userEvent.keyboard('{Escape}');
  await expect.element(group).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Bed colour' })).toHaveFocus();
  expect(onCommit).toHaveBeenCalledTimes(1);
  expect(onCommit).toHaveBeenCalledWith('#ffeb3b');
});

test('the saturation and brightness square moves on both axes from the keyboard', async () => {
  await render(ColorPickerFixture, { value: '#808080' });

  await page.getByRole('button', { name: 'Bed colour' }).click();
  await expect
    .element(page.getByRole('group', { name: 'Saturation and brightness' }))
    .toBeVisible();
  const saturation = page.getByRole('slider', { name: 'Saturation' });
  const brightness = page.getByRole('slider', { name: 'Brightness' });
  await expect.element(saturation).toHaveAttribute('aria-valuetext', 'Saturation 0%');
  await expect.element(brightness).toHaveAttribute('aria-valuetext', 'Brightness 50%');

  focus(saturation);
  await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
  await expect.element(saturation).toHaveAttribute('aria-valuetext', 'Saturation 10%');
  await userEvent.keyboard('{ArrowUp}{PageUp}');
  await expect.element(brightness).toHaveAttribute('aria-valuetext', 'Brightness 61%');
  await expect.element(page.getByTestId('bound')).not.toHaveTextContent('#808080');
});

test('a pointer press on the square sets both axes', async () => {
  await render(ColorPickerFixture, { value: '#808080', withSwatches: false });

  await page.getByRole('button', { name: 'Bed colour' }).click();
  const area = page.getByRole('group', { name: 'Saturation and brightness' });
  const { width, height } = instanceOf(area.element(), HTMLElement).getBoundingClientRect();
  await area.click({ position: { x: width * 0.75, y: height * 0.25 } });
  await expect
    .element(page.getByRole('slider', { name: 'Saturation' }))
    .toHaveAttribute('aria-valuetext', 'Saturation 75%');
  await expect
    .element(page.getByRole('slider', { name: 'Brightness' }))
    .toHaveAttribute('aria-valuetext', 'Brightness 75%');
});

test('the hue strip is a slider in degrees', async () => {
  await render(ColorPickerFixture);

  await page.getByRole('button', { name: 'Bed colour' }).click();
  const hue = page.getByRole('slider', { name: 'Hue' });
  await expect.element(hue).toHaveAttribute('aria-valuemax', '360');
  focus(hue);
  await userEvent.keyboard('{End}');
  await expect.element(hue).toHaveAttribute('aria-valuetext', '360°');
  await userEvent.keyboard('{Home}');
  await expect.element(hue).toHaveAttribute('aria-valuetext', '0°');
  await expect.element(page.getByTestId('bound')).toHaveTextContent('#7d3a3a');
});

test('the hex field reverts invalid input on blur and commits a valid one on Enter', async () => {
  await render(ColorPickerFixture, { withSwatches: false });

  await page.getByRole('button', { name: 'Bed colour' }).click();
  const hex = page.getByRole('textbox', { name: 'Hex' });
  await hex.fill('#zzz');
  focus(page.getByRole('slider', { name: 'Hue' }));
  await expect.element(hex).toHaveValue('#3a7d44');

  await hex.fill('1e3a5f');
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByTestId('bound')).toHaveTextContent('#1e3a5f');
  await expect.element(hex).toHaveValue('#1e3a5f');
});

test('with alpha and format rgb, the opacity strip writes an rgb() with a slash term', async () => {
  await render(ColorPickerFixture, { alpha: true, format: 'rgb', withSwatches: false });

  await page.getByRole('button', { name: 'Bed colour' }).click();
  const opacity = page.getByRole('slider', { name: 'Opacity' });
  await expect.element(opacity).toHaveAttribute('aria-valuetext', '100%');
  focus(opacity);
  await userEvent.keyboard('{Home}');
  await expect.element(opacity).toHaveAttribute('aria-valuetext', '0%');
  for (let step = 0; step < 50; step += 1) await userEvent.keyboard('{ArrowRight}');
  await expect.element(page.getByTestId('bound')).toHaveTextContent('rgb(58 125 68 / 0.5)');
});

test('a wrapping form posts the value under name', async () => {
  let posted: FormData | undefined;
  await render(ColorPickerFixture, {
    onSubmitted: (data: FormData) => {
      posted = data;
    },
  });

  await page.getByRole('button', { name: 'Save' }).click();
  await vi.waitFor(() => {
    expect(posted?.get('colour')).toBe('#3a7d44');
  });
});
