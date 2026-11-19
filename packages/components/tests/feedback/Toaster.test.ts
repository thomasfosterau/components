/**
 * `Toaster` — one polite live region, present from mount and named, with
 * nothing live inside it. The doubled announcement a `role="status"` per toast
 * produces is the bug this component exists to have fixed, so its absence is
 * asserted rather than assumed.
 *
 * Auto-dismissal is driven by fake timers, not by a short real duration: the
 * dismiss timer starts inside the click, so a real duration races the
 * `userEvent` round trip and the first poll under suite load. Only
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
  const screen = await render(ToasterFixture, { toastDurationMs: 5_000 });
  const toast = () => screen.getByText('Bed 1 saved').elements();
  const push = screen.getByRole('button', { name: 'Push a toast' }).element();

  // Push synchronously: a `userEvent` action awaited under fake timers advances
  // them 50 ms per 50 ms of real time until the provider answers (Vitest 5.1's
  // `advanceFakeTimersWhilePending`), so the clock would already be past the
  // push when the action resolves.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  push.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

/**
 * Push an action toast synchronously, under fake timers that include `Date`.
 * The real pointer is moved off the region first: an earlier test may have
 * left it where the new toast appears, and a hovered toast holds its timer.
 */
const pushActionToast = async (screen: Awaited<ReturnType<typeof render>>): Promise<void> => {
  await userEvent.hover(screen.getByTestId('last-id'));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  screen
    .getByRole('button', { name: 'Push an action toast' })
    .element()
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
};

test('an action is a button inside the region, and the toast text names it', async () => {
  const screen = await render(ToasterFixture, { durationMs: 0 });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));

  const region = screen.getByLabelText('Notifications');
  await expect.element(region.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  await expect.element(region).toHaveTextContent('Undo available');
});

test('actionHint is a prop', async () => {
  const screen = await render(ToasterFixture, {
    durationMs: 0,
    actionHint: (label: string) => `Press ${label} to restore`,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));

  await expect
    .element(screen.getByLabelText('Notifications'))
    .toHaveTextContent('Press Undo to restore');
});

test('activating the action runs it, removes the toast and resolves result with action', async () => {
  const onAction = vi.fn<(signal: AbortSignal) => void>();
  const screen = await render(ToasterFixture, { durationMs: 0, onAction });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(onAction).toHaveBeenCalledOnce();
  expect(onAction.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
  await expect.element(screen.getByTestId('outcome')).toHaveTextContent('action');
  expect(screen.getByText('Bed 1 deleted').elements()).toHaveLength(0);
});

test('a pending action keeps the toast and marks its button busy, with the same name', async () => {
  const { promise, resolve: finish } = Promise.withResolvers<void>();
  const onAction = () => promise;
  const screen = await render(ToasterFixture, { durationMs: 0, onAction });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

  const undo = screen.getByRole('button', { name: 'Undo' });
  await expect.element(undo).toHaveAttribute('aria-busy', 'true');
  await expect.element(undo).toBeDisabled();
  await expect.element(screen.getByTestId('outcome')).toHaveTextContent('pending');

  finish();
  await expect.element(screen.getByTestId('outcome')).toHaveTextContent('action');
  expect(screen.getByText('Bed 1 deleted').elements()).toHaveLength(0);
});

test('a rejected action keeps the toast, shows the error and can be retried', async () => {
  let attempts = 0;
  const onAction = () => {
    attempts += 1;
    if (attempts === 1) return Promise.reject(new Error('The bed could not be restored.'));
    return Promise.resolve();
  };
  const screen = await render(ToasterFixture, { durationMs: 0, onAction });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

  await expect.element(screen.getByText('The bed could not be restored.')).toBeInTheDocument();
  await expect.element(screen.getByText('Bed 1 deleted')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('button', { name: 'Undo' }))
    .not.toHaveAttribute('aria-busy');
  await expect.element(screen.getByTestId('outcome')).toHaveTextContent('pending');

  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.element(screen.getByTestId('outcome')).toHaveTextContent('action');
});

test('formatActionError is a prop', async () => {
  const screen = await render(ToasterFixture, {
    durationMs: 0,
    onAction: () => Promise.reject(new Error('500')),
    formatActionError: () => 'Undo failed. Try again.',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

  await expect.element(screen.getByText('Undo failed. Try again.')).toBeInTheDocument();
});

test('the dismiss button resolves result with dismissed', async () => {
  const screen = await render(ToasterFixture, { durationMs: 0 });

  await userEvent.click(screen.getByRole('button', { name: 'Push an action toast' }));
  await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

  await expect.element(screen.getByTestId('outcome')).toHaveTextContent('dismissed');
});

test('an action toast outlives the default duration and times out at actionDurationMs', async () => {
  const screen = await render(ToasterFixture, { durationMs: 1_000, actionDurationMs: 8_000 });
  const toast = () => screen.getByText('Bed 1 deleted').elements();

  await pushActionToast(screen);
  expect(toast()).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(7_999);
  flushSync();
  expect(toast()).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(1);
  flushSync();
  expect(toast()).toHaveLength(0);
  expect(screen.getByTestId('outcome').element()).toHaveTextContent('timeout');
});

test('hovering a toast pauses its timer, and leaving resumes what was left', async () => {
  const screen = await render(ToasterFixture, { actionDurationMs: 8_000 });
  const toast = () => screen.getByText('Bed 1 deleted').elements();

  await pushActionToast(screen);
  await vi.advanceTimersByTimeAsync(5_000);

  const card = toast()[0]?.closest('.alert');
  card?.dispatchEvent(new PointerEvent('pointerenter'));
  await vi.advanceTimersByTimeAsync(20_000);
  flushSync();
  expect(toast()).toHaveLength(1);

  card?.dispatchEvent(new PointerEvent('pointerleave'));
  await vi.advanceTimersByTimeAsync(2_999);
  flushSync();
  expect(toast()).toHaveLength(1);

  await vi.advanceTimersByTimeAsync(1);
  flushSync();
  expect(toast()).toHaveLength(0);
});

test('focus inside a toast pauses its timer', async () => {
  const screen = await render(ToasterFixture, { actionDurationMs: 8_000 });
  const toast = () => screen.getByText('Bed 1 deleted').elements();

  await pushActionToast(screen);
  const undo = screen.getByRole('button', { name: 'Undo' }).element();
  undo.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  flushSync();
  await vi.advanceTimersByTimeAsync(20_000);
  flushSync();
  expect(toast()).toHaveLength(1);

  undo.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
  flushSync();
  await vi.advanceTimersByTimeAsync(8_000);
  flushSync();
  expect(toast()).toHaveLength(0);
});

test('an explicit duration still wins for an action toast', async () => {
  const screen = await render(ToasterFixture, { toastDurationMs: 0, actionDurationMs: 1_000 });

  await pushActionToast(screen);
  await vi.advanceTimersByTimeAsync(5_000);
  flushSync();

  expect(screen.getByText('Bed 1 deleted').elements()).toHaveLength(1);
});
