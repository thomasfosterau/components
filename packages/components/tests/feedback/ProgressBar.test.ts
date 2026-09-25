/**
 * `ProgressBar` — the native `<progress>` contract: named by `label`, a
 * percentage in `aria-valuetext`, and a genuinely indeterminate element (no
 * `value` attribute at all) when no value is given.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ProgressBar from '../../src/lib/feedback/ProgressBar.svelte';

test('is named by its label and exposes its value', async () => {
  const screen = await render(ProgressBar, { label: 'Seeds germinated', value: 62 });

  const bar = screen.getByRole('progressbar', { name: 'Seeds germinated' });
  await expect.element(bar).toHaveAttribute('value', '62');
  await expect.element(bar).toHaveAttribute('max', '100');
  await expect.element(bar).toHaveAttribute('aria-valuetext', '62%');
});

test('scales the percentage to a max other than 100', async () => {
  const screen = await render(ProgressBar, {
    label: 'Beds photographed',
    value: 19,
    max: 31,
    locales: 'en-AU',
  });

  await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '61.3%');
});

test('is indeterminate without a value, and carries no value text', async () => {
  const screen = await render(ProgressBar, { label: 'Importing the seed list' });

  const bar = screen.getByRole('progressbar', { name: 'Importing the seed list' });
  await expect.element(bar).not.toHaveAttribute('value');
  await expect.element(bar).not.toHaveAttribute('aria-valuetext');
});

test('clamps a value outside the range', async () => {
  const screen = await render(ProgressBar, { label: 'Storage used', value: 140 });

  await expect.element(screen.getByRole('progressbar')).toHaveAttribute('value', '100');
});

test('showValue prints the percentage, hidden from assistive technology', async () => {
  const screen = await render(ProgressBar, {
    label: 'Storage used',
    value: 94,
    showValue: true,
    locales: 'en-AU',
  });

  const printed = screen.getByText('94%');
  await expect.element(printed).toBeInTheDocument();
  await expect.element(printed).toHaveAttribute('aria-hidden', 'true');
});

test('takes a tone from the lookup table and merges the caller’s class', async () => {
  const screen = await render(ProgressBar, {
    label: 'Storage used',
    value: 10,
    tone: 'warning',
    class: 'mt-4',
  });

  const bar = screen.getByRole('progressbar');
  await expect.element(bar).toHaveClass('progress-warning');
  expect(bar.element().parentElement).toHaveClass('mt-4');
});
