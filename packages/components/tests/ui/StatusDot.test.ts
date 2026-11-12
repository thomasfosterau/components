import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import StatusDot from '../../src/lib/ui/StatusDot.svelte';

test('label is real text, screen-reader only by default, and the dot is hidden', async () => {
  const screen = await render(StatusDot, { label: 'Offline', tone: 'error' });

  const text = screen.getByText('Offline');
  await expect.element(text).toBeInTheDocument();
  await expect.element(text).toHaveClass('sr-only');
  const dot = screen.container.querySelector('.status');
  expect(dot?.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(dot?.classList.contains('status-error')).toBe(true);
  expect(dot?.classList.contains('status-md')).toBe(true);
});

test('showLabel prints the label', async () => {
  const screen = await render(StatusDot, { label: 'Online', tone: 'success', showLabel: true });

  await expect.element(screen.getByText('Online')).not.toHaveClass('sr-only');
});

test('pulse adds a second, reduced-motion-aware dot behind the first', async () => {
  const screen = await render(StatusDot, { label: 'Live', pulse: true, size: 'lg' });

  const dots = screen.container.querySelectorAll('.status');
  expect(dots).toHaveLength(2);
  expect(dots[0]?.classList.contains('animate-ping')).toBe(true);
  expect(dots[0]?.classList.contains('motion-reduce:animate-none')).toBe(true);
  expect(dots[1]?.classList.contains('status-lg')).toBe(true);
});

test('label is required', async () => {
  // @ts-expect-error — a dot without a label is colour alone.
  const screen = await render(StatusDot, { tone: 'error' });
  expect(screen.container.querySelector('.status')).not.toBeNull();
});

test('spreads native attributes and merges class', async () => {
  const screen = await render(StatusDot, { label: 'Offline', id: 'sensor-3', class: 'mine' });

  const root = screen.container.querySelector('#sensor-3');
  expect(root?.classList.contains('mine')).toBe(true);
  expect(root?.classList.contains('inline-flex')).toBe(true);
});
