import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { LeaveGuard } from '../../src/lib/forms/leave-guard.svelte.ts';
import LeaveGuardFixture from './fixtures/LeaveGuardFixture.svelte';

const mount = async (dirty: boolean) => {
  let guard: LeaveGuard | undefined;
  const screen = await render(LeaveGuardFixture, {
    dirty,
    onGuard: (made: LeaveGuard) => {
      guard = made;
    },
  });
  if (guard === undefined) throw new Error('the fixture did not create a guard');
  return { screen, guard };
};

const beforeUnloadCalls = (spy: { mock: { calls: readonly (readonly unknown[])[] } }): number =>
  spy.mock.calls.filter(([type]) => type === 'beforeunload').length;

test('beforeunload is registered only while dirty, and removed when clean', async () => {
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  try {
    const clean = await mount(false);
    expect(beforeUnloadCalls(add)).toBe(0);

    await clean.screen.rerender({ dirty: true });
    await vi.waitFor(() => {
      expect(beforeUnloadCalls(add)).toBe(1);
    });
    expect(beforeUnloadCalls(remove)).toBe(0);

    await clean.screen.rerender({ dirty: false });
    await vi.waitFor(() => {
      expect(beforeUnloadCalls(remove)).toBe(1);
    });
  } finally {
    add.mockRestore();
    remove.mockRestore();
  }
});

test('beforeunload prevents the default, and is removed on unmount', async () => {
  const { screen } = await mount(true);
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);

  await screen.unmount();
  const after = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
});

test('while clean, confirmLeave resolves true at once with no dialog', async () => {
  const { screen, guard } = await mount(false);

  expect(guard.shouldBlock()).toBe(false);
  await expect(guard.confirmLeave()).resolves.toBe(true);
  expect(screen.getByRole('alertdialog').elements()).toHaveLength(0);
});

test('while dirty, confirmLeave opens an alertdialog with focus on Stay', async () => {
  const { screen, guard } = await mount(true);

  expect(guard.shouldBlock()).toBe(true);
  void guard.confirmLeave();

  const dialog = screen.getByRole('alertdialog', { name: 'Leave this page?' });
  await expect.element(dialog).toBeInTheDocument();
  await expect.element(dialog).toHaveAccessibleDescription('Changes you made will not be saved.');
  await expect.element(screen.getByRole('button', { name: 'Stay' })).toHaveFocus();
});

test('choosing Leave resolves true and closes the dialog', async () => {
  const { screen, guard } = await mount(true);
  const answer = guard.confirmLeave();

  await userEvent.click(screen.getByRole('button', { name: 'Leave' }));

  await expect(answer).resolves.toBe(true);
  await expect.element(screen.getByRole('alertdialog')).not.toBeInTheDocument();
});

test('choosing Stay resolves false', async () => {
  const { screen, guard } = await mount(true);
  const answer = guard.confirmLeave();

  await userEvent.click(screen.getByRole('button', { name: 'Stay' }));

  await expect(answer).resolves.toBe(false);
});

test('Escape is Stay', async () => {
  const { screen, guard } = await mount(true);
  const answer = guard.confirmLeave();
  await expect.element(screen.getByRole('alertdialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  await expect(answer).resolves.toBe(false);
  await expect.element(screen.getByRole('alertdialog')).not.toBeInTheDocument();
});

test('a second call while the question is open shares its answer', async () => {
  const { screen, guard } = await mount(true);
  const first = guard.confirmLeave();
  const second = guard.confirmLeave();

  await userEvent.click(screen.getByRole('button', { name: 'Leave' }));

  await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
});
