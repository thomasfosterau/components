import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Spinner from '../../src/lib/ui/Spinner.svelte';

test('is a status named Loading, with the animated shape hidden', async () => {
  const screen = await render(Spinner, {});

  const status = screen.getByRole('status', { name: 'Loading' });
  await expect.element(status).toBeInTheDocument();
  const shape = status.element().querySelector('.loading');
  expect(shape?.getAttribute('aria-hidden')).toBe('true');
  expect(shape?.classList.contains('loading-spinner')).toBe(true);
});

test('label names it; showLabel prints it without announcing it twice', async () => {
  const screen = await render(Spinner, { label: 'Fetching seed list', showLabel: true });

  const status = screen.getByRole('status', { name: 'Fetching seed list' });
  await expect.element(status).toBeInTheDocument();
  await expect.element(screen.getByText('Fetching seed list')).toBeVisible();
  await expect
    .element(screen.getByText('Fetching seed list'))
    .toHaveAttribute('aria-hidden', 'true');
});

test('decorative renders the shape alone, hidden, with no status', async () => {
  const screen = await render(Spinner, { decorative: true, 'data-testid': 'spin' });

  expect(screen.getByRole('status').elements()).toHaveLength(0);
  await expect.element(screen.getByTestId('spin')).toHaveAttribute('aria-hidden', 'true');
  await expect.element(screen.getByTestId('spin')).toHaveClass('loading');
});

test('variant, size and tone pick their literal classes; class merges last', async () => {
  const screen = await render(Spinner, {
    variant: 'dots',
    size: 'lg',
    tone: 'primary',
    class: 'ms-2',
  });

  const status = screen.getByRole('status');
  await expect.element(status).toHaveClass('ms-2');
  const shape = status.element().querySelector('.loading');
  expect([...(shape?.classList ?? [])]).toEqual(
    expect.arrayContaining(['loading-dots', 'loading-lg', 'text-primary']),
  );
});
