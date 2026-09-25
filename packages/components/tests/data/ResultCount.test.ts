/**
 * `ResultCount` qualifies a windowed list — and stays quiet when there is
 * nothing to qualify, because "Showing 0 of 0" beside an empty state is noise
 * rather than reassurance.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ResultCount from '../../src/lib/data/ResultCount.svelte';

test('formats the counts in the caller’s locale', async () => {
  const screen = await render(ResultCount, { shown: 24, total: 4310, locales: 'en-AU' });

  await expect.element(screen.getByText('Showing 24 of 4,310')).toBeInTheDocument();
});

test('takes the whole sentence as a prop', async () => {
  const screen = await render(ResultCount, {
    shown: 24,
    total: 310,
    label: (shown, total) => `${shown} of ${total} plants`,
  });

  await expect.element(screen.getByText('24 of 310 plants')).toBeInTheDocument();
});

test('renders nothing when there is nothing to qualify', async () => {
  const screen = await render(ResultCount, { shown: 0, total: 0 });

  expect(screen.getByText(/Showing/).elements()).toHaveLength(0);
});
