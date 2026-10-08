/**
 * `Toaster` — one polite live region, present from mount and named, with
 * nothing live inside it. The doubled announcement a `role="status"` per toast
 * produces is the bug this component exists to have fixed, so its absence is
 * asserted rather than assumed.
 *
 * Auto-dismissal is driven by fake timers, not by a short real duration: the
 * dismiss timer starts inside the click, so a real duration races the
 * `userEvent` round trip and the first poll under suite load (#75). Only
 * `setTimeout`/`clearTimeout` are faked — the pair `Toaster` uses — so
 * Playwright's clock keeps running underneath. The auto-dismiss checks are
 * synchronous (`flushSync` + `.elements()`), never `expect.element`: while fake
 * timers are on, Vitest's poll loop calls `vi.advanceTimersByTime(interval)`
 * after every failed retry, so a retrying assertion would move the clock
 * itself and let a late (or early) timer pass.
 */

import { afterEach, expect, test, vi } from 'vite-plus/test';
import { flushSync } from 'svelte';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import ToasterFixture from './fixtures/ToasterFixture.svelte';

afterEach(() => {
  vi.useRealTimers();
});

test('the region is in the document from mount, polite and named', async () => {
  const screen = await render(ToasterFixture);

  const region = screen.getByLabelText('Notifications');
  await expect.element(region).toBeInTheDocument();
  await expect.element(region).toHaveAttribute('aria-live', 'polite');
  expect(region.element().children).toHaveLength(0);
});

test('regionLabel and position are props', async () => {
  const screen = await render(ToasterFixture, {
    regionLabel: 'Garden notifications',
    position: 'top-start',
  });

  const region = screen.getByLabelText('Garden notifications');
  await expect.element(region).toHaveClass('toast-top');
  await expect.element(region).toHaveClass('toast-start');
});

test('add renders the toast inside the region, with no live region of its own', async () => {
  const screen = await render(ToasterFixture, { durationMs: 0 });

  await userEvent.click(screen.getByRole('button', { name: 'Push a toast' }));

  const region = screen.getByLabelText('Notifications').element();
  await expect.element(screen.getByText('Bed 1 saved')).toBeInTheDocument();
  await expect.element(screen.getByText('Every plant in it moved with it.')).toBeInTheDocument();
  expect(region.querySelectorAll('[role="status"], [role="alert"], [aria-live]')).toHaveLength(0);
});

test('add returns an id, and dismiss removes that toast', async () => {
  const screen = await render(ToasterFixture, { durationMs: 0 });

  await userEvent.click(screen.getByRole('button', { name: 'Push a toast' }));
  await expect.element(screen.getByTestId('last-id')).toHaveTextContent('1');

  await userEvent.click(screen.getByRole('button', { name: 'Dismiss the last toast' }));

  expect(screen.getByText('Bed 1 saved').elements()).toHaveLength(0);
});

test('the dismiss button is a labelled control and removes its toast', async () => {
  const screen = await render(ToasterFixture, {
    durationMs: 0,
    dismissLabel: 'Dismiss this notification',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Push a toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Dismiss this notification' }));

  expect(screen.getByText('Bed 1 saved').elements()).toHaveLength(0);
});

test('a toast dismisses itself after its duration', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const screen = await render(ToasterFixture, { toastDurationMs: 5_000 });
  const toast = () => screen.getByText('Bed 1 saved').elements();

  await userEvent.click(screen.getByRole('button', { name: 'Push a toast' }));
  flushSync();
  // The clock is held, so presence no longer races the timer.
  expect(toast()).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(4_999);
  flushSync();
  expect(toast()).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(1);
  flushSync();
  expect(toast()).toHaveLength(0);
});

test('a duration of 0 makes a toast sticky', async () => {
  const screen = await render(ToasterFixture, { durationMs: 0 });

  await userEvent.click(screen.getByRole('button', { name: 'Push a toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Push a toast' }));

  await expect.element(screen.getByText('Bed 2 saved')).toBeInTheDocument();
  await expect.element(screen.getByText('Bed 1 saved')).toBeInTheDocument();
});
