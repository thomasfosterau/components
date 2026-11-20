import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import RadialProgress from '../../src/lib/feedback/RadialProgress.svelte';

test('by default a progressbar with its value', async () => {
  const screen = await render(RadialProgress, { label: 'Upload', value: 40 });

  const ring = screen.getByRole('progressbar', { name: 'Upload' });
  await expect.element(ring).toHaveAttribute('aria-valuenow', '40');
  await expect.element(ring).toHaveAttribute('aria-valuemax', '100');
  await expect.element(ring).toHaveAttribute('aria-valuetext', '40%');
});

test('kind="meter" is a meter', async () => {
  const screen = await render(RadialProgress, {
    label: 'Soil moisture',
    kind: 'meter',
    value: 0.6,
    max: 1,
  });

  await expect
    .element(screen.getByRole('meter', { name: 'Soil moisture' }))
    .toHaveAttribute('aria-valuetext', '60%');
});

test('without a value it is indeterminate: no aria-valuenow', async () => {
  const screen = await render(RadialProgress, { label: 'Upload' });

  const ring = screen.getByRole('progressbar', { name: 'Upload' });
  await expect.element(ring).not.toHaveAttribute('aria-valuenow');
  await expect.element(ring).not.toHaveAttribute('aria-valuetext');
});

test('an out-of-range value is clamped in aria-valuenow and --value', async () => {
  const screen = await render(RadialProgress, { label: 'Upload', value: 140 });

  const ring = screen.getByRole('progressbar').element();
  expect(ring.getAttribute('aria-valuenow')).toBe('100');
  expect(ring.getAttribute('style')).toContain('--value: 100');
});

test('the centre figure is hidden, leaving one accessible value', async () => {
  const screen = await render(RadialProgress, { label: 'Upload', value: 25 });

  const figure = screen.getByText('25%').element();
  expect(figure.getAttribute('aria-hidden')).toBe('true');
});
