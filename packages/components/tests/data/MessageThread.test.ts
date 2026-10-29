/**
 * `MessageThread` — a named region around an ordered list of messages;
 * `live` makes it a polite log.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ThreadFixture from './fixtures/ThreadFixture.svelte';

test('a region named by label, holding one list of messages', async () => {
  const screen = await render(ThreadFixture, {});

  const region = screen.getByRole('region', { name: 'Comments on Bed 4' });
  await expect.element(region).toBeInTheDocument();
  const list = region.getByRole('list');
  expect(list.element().tagName).toBe('OL');
  expect(list.getByRole('listitem').elements()).toHaveLength(2);
});

test('live: a polite log', async () => {
  const screen = await render(ThreadFixture, { live: true });

  const log = screen.getByRole('log', { name: 'Comments on Bed 4' });
  await expect.element(log).toHaveAttribute('aria-live', 'polite');
});
