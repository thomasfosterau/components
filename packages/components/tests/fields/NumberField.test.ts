import { userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import NumberFieldFixture from './fixtures/NumberFieldFixture.svelte';

afterEach(() => {
  vi.useRealTimers();
});

test('is a spinbutton named by its label, reporting value and bounds', async () => {
  const screen = await render(NumberFieldFixture, { value: 3, min: 1, max: 10, locales: 'en-AU' });

  const field = screen.getByRole('spinbutton', { name: 'Bed width' });
  await expect.element(field).toHaveAttribute('aria-valuenow', '3');
  await expect.element(field).toHaveAttribute('aria-valuemin', '1');
  await expect.element(field).toHaveAttribute('aria-valuemax', '10');
  await expect.element(field).toHaveAccessibleDescription('In metres.');
  await expect.element(field).toHaveAttribute('inputmode', 'decimal');
});

test('ArrowUp increments; at max the Increase button is disabled', async () => {
  const onCommit = vi.fn();
  const screen = await render(NumberFieldFixture, {
    value: 9,
    max: 10,
    locales: 'en-AU',
    onCommit,
  });

  const field = screen.getByRole('spinbutton', { name: 'Bed width' });
  await userEvent.click(field);
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(field).toHaveAttribute('aria-valuenow', '10');
  expect(onCommit).toHaveBeenLastCalledWith(10);
  await expect.element(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(field).toHaveAttribute('aria-valuenow', '10');
});

test('Page keys take a large step, Home and End go to the bounds', async () => {
  const screen = await render(NumberFieldFixture, {
    value: 50,
    min: 0,
    max: 100,
    locales: 'en-AU',
  });

  const field = screen.getByRole('spinbutton');
  await userEvent.click(field);
  await userEvent.keyboard('{PageUp}');
  await expect.element(field).toHaveAttribute('aria-valuenow', '60');
  await userEvent.keyboard('{PageDown}{PageDown}{ArrowDown}');
  await expect.element(field).toHaveAttribute('aria-valuenow', '39');
  await userEvent.keyboard('{Home}');
  await expect.element(field).toHaveAttribute('aria-valuenow', '0');
  await userEvent.keyboard('{End}');
  await expect.element(field).toHaveAttribute('aria-valuenow', '100');
});

test('the buttons step, keep focus on the spinbutton and stay out of the tab order', async () => {
  const screen = await render(NumberFieldFixture, { value: 2, locales: 'en-AU' });

  const field = screen.getByRole('spinbutton');
  const increase = screen.getByRole('button', { name: 'Increase' });
  await expect.element(increase).toHaveAttribute('tabindex', '-1');
  await expect
    .element(screen.getByRole('button', { name: 'Decrease' }))
    .toHaveAttribute('tabindex', '-1');

  await userEvent.click(field);
  await userEvent.click(increase);
  await expect.element(field).toHaveAttribute('aria-valuenow', '3');
  await expect.element(field).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Decrease' }));
  await expect.element(field).toHaveAttribute('aria-valuenow', '2');

  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
});

test('de-DE: typing 1.234,5 then blurring commits 1234.5 and shows 1.234,5', async () => {
  const screen = await render(NumberFieldFixture, { locales: 'de-DE' });

  const field = screen.getByRole('spinbutton');
  await userEvent.fill(field, '1.234,5');
  await userEvent.tab();

  await expect.element(screen.getByTestId('bound')).toHaveTextContent('1234.5');
  await expect.element(field).toHaveValue('1.234,5');
});

test('a percent format reads the formatted value as aria-valuetext', async () => {
  const screen = await render(NumberFieldFixture, {
    value: 0.45,
    locales: 'en-AU',
    formatOptions: { style: 'percent' },
    step: 0.01,
  });

  const field = screen.getByRole('spinbutton');
  await expect.element(field).toHaveAttribute('aria-valuetext', '45%');
  await expect.element(field).toHaveValue('45%');
});

test('garbage reverts on blur; clearing the field gives undefined', async () => {
  const screen = await render(NumberFieldFixture, { value: 7, locales: 'en-AU' });

  const field = screen.getByRole('spinbutton');
  await userEvent.fill(field, 'lots');
  await userEvent.tab();
  await expect.element(field).toHaveValue('7');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('7');

  await userEvent.fill(field, '');
  await userEvent.tab();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('undefined');
  await expect.element(field).not.toHaveAttribute('aria-valuenow');
});

test('typed values are clamped to the bounds on commit', async () => {
  const screen = await render(NumberFieldFixture, { min: 0, max: 20, locales: 'en-AU' });

  const field = screen.getByRole('spinbutton');
  await userEvent.fill(field, '250');
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('20');
});

test('a wrapping form posts the raw number, not the formatted text', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(NumberFieldFixture, {
    value: 1234.5,
    locales: 'de-DE',
    formatOptions: { style: 'unit', unit: 'centimeter' },
    onSubmitted,
  });

  await expect.element(screen.getByRole('spinbutton')).toHaveValue('1.234,5 cm');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.get('width')).toBe('1234.5');
});

test('holding Increase for a second steps more than once', async () => {
  const screen = await render(NumberFieldFixture, { value: 0, locales: 'en-AU' });

  const increase = screen.getByRole('button', { name: 'Increase' }).element();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  increase.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }),
  );
  vi.advanceTimersByTime(1000);
  increase.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 }));
  vi.useRealTimers();

  // The steps ran under fake timers; the DOM catches up on Svelte's next flush.
  const field = screen.getByRole('spinbutton');
  const valueNow = (): number => Number(field.element().getAttribute('aria-valuenow'));
  await expect.poll(valueNow).toBeGreaterThan(2);
  const after = valueNow();

  // Released: no more steps.
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(valueNow()).toBe(after);
});
