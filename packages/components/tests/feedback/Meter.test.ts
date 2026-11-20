import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Meter from '../../src/lib/feedback/Meter.svelte';

test('a meter named by its label, with the locale percentage as its value text', async () => {
  const screen = await render(Meter, { label: 'Soil moisture', value: 0.34 });

  const meter = screen.getByRole('meter', { name: 'Soil moisture' });
  await expect.element(meter).toHaveAttribute('aria-valuetext', '34%');
  expect(screen.getByRole('progressbar').elements()).toHaveLength(0);
});

test('the percentage follows the locale', async () => {
  const screen = await render(Meter, { label: 'Soil moisture', value: 0.34, locales: 'fr' });

  const french = new Intl.NumberFormat('fr', { style: 'percent' }).format(0.34);
  expect(french).not.toBe('34%');
  await expect.element(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', french);
});

test('thresholds pass through to the native element, and valueText wins', async () => {
  const screen = await render(Meter, {
    label: 'Storage',
    value: 7.2,
    max: 10,
    low: 3,
    high: 8,
    optimum: 1,
    valueText: '7.2 GB of 10 GB',
    showValue: true,
  });

  const meter = screen.getByRole('meter', { name: 'Storage' }).element();
  if (!(meter instanceof HTMLMeterElement)) throw new Error('not a meter');
  expect([meter.value, meter.max, meter.low, meter.high, meter.optimum]).toEqual([
    7.2, 10, 3, 8, 1,
  ]);
  expect(meter.getAttribute('aria-valuetext')).toBe('7.2 GB of 10 GB');
  const figure = screen.getByText('7.2 GB of 10 GB').element();
  expect(figure.getAttribute('aria-hidden')).toBe('true');
});

test('an out-of-range value is clamped', async () => {
  const screen = await render(Meter, { label: 'Battery', value: 1.4 });

  await expect.element(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '100%');
});
