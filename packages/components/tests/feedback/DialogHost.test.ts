import { expect, test } from 'vite-plus/test';
import { userEvent, type Locator } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { DialogsApi } from '../../src/lib/feedback/dialogs.ts';
import DialogHostFixture from './fixtures/DialogHostFixture.svelte';

const focus = (locator: Locator): void => {
  const element = locator.element();
  if (element instanceof HTMLElement) element.focus();
};

const setup = async () => {
  let api: DialogsApi | undefined;
  const screen = await render(DialogHostFixture, {
    onReady: (ready: DialogsApi) => {
      api = ready;
    },
  });
  if (api === undefined) throw new Error('DialogHost did not publish its API');
  return { screen, dialogs: api };
};

test('confirm opens a named dialog; confirming resolves true and returns focus', async () => {
  const { screen, dialogs } = await setup();
  const trigger = screen.getByRole('button', { name: 'Delete Bed 5' });
  focus(trigger);

  const answer = dialogs.confirm({ title: 'Delete bed 5?', confirmLabel: 'Delete', tone: 'error' });
  await expect.element(screen.getByRole('dialog', { name: 'Delete bed 5?' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));

  await expect(answer).resolves.toBe(true);
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test('Escape resolves a confirm as false', async () => {
  const { screen, dialogs } = await setup();

  const answer = dialogs.confirm({ title: 'Leave without saving?' });
  await expect.element(screen.getByRole('button', { name: 'OK' })).toBeVisible();
  await userEvent.keyboard('{Escape}');

  await expect(answer).resolves.toBe(false);
});

test('prompt resolves with the typed value, and Cancel resolves undefined', async () => {
  const { screen, dialogs } = await setup();

  const named = dialogs.prompt({
    title: 'Rename bed',
    label: 'Name',
    value: 'Bed 4',
    confirmLabel: 'Rename',
  });
  const field = screen.getByRole('textbox', { name: 'Name' });
  await expect.element(field).toHaveFocus();
  await userEvent.fill(field, 'North bed');
  await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
  await expect(named).resolves.toBe('North bed');

  const cancelled = dialogs.prompt({ title: 'Rename bed', label: 'Name' });
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await expect(cancelled).resolves.toBeUndefined();
});

test('alert resolves once its button closes it', async () => {
  const { screen, dialogs } = await setup();

  const done = dialogs.alert({ title: 'Export finished', okLabel: 'Got it' });
  await expect.element(screen.getByRole('dialog', { name: 'Export finished' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Got it' }));

  await expect(done).resolves.toBeUndefined();
});

test('concurrent requests open one at a time and resolve independently', async () => {
  const { screen, dialogs } = await setup();

  const first = dialogs.confirm({ title: 'First?' });
  const second = dialogs.confirm({ title: 'Second?' });
  await expect.element(screen.getByRole('dialog', { name: 'First?' })).toBeVisible();
  expect(screen.getByRole('dialog').elements()).toHaveLength(1);

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await expect(first).resolves.toBe(false);

  await expect.element(screen.getByRole('dialog', { name: 'Second?' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'OK' }));
  await expect(second).resolves.toBe(true);
});

test('aborting the signal closes the open dialog, or drops a queued one, as cancelled', async () => {
  const { screen, dialogs } = await setup();
  const open = new AbortController();
  const queued = new AbortController();

  const first = dialogs.confirm({ title: 'First?' }, open.signal);
  const second = dialogs.prompt({ title: 'Second?', label: 'Name' }, queued.signal);
  await expect.element(screen.getByRole('dialog', { name: 'First?' })).toBeVisible();

  queued.abort();
  await expect(second).resolves.toBeUndefined();
  open.abort();
  await expect(first).resolves.toBe(false);
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();

  await expect(dialogs.confirm({ title: 'Never shown' }, open.signal)).resolves.toBe(false);
});

test('when the focused element is removed, focus lands on its nearest focusable ancestor', async () => {
  const { screen, dialogs } = await setup();
  focus(screen.getByRole('button', { name: 'Delete Bed 4' }));

  const answer = dialogs.confirm({ title: 'Delete bed 4?' });
  await expect.element(screen.getByRole('dialog')).toBeVisible();
  screen.component.remove('Bed 4');
  await userEvent.click(screen.getByRole('button', { name: 'OK' }));

  await expect(answer).resolves.toBe(true);
  await expect.element(screen.getByRole('list', { name: 'Beds' })).toHaveFocus();
});

test('with no focusable ancestor left, focus lands on main', async () => {
  const { screen, dialogs } = await setup();
  focus(screen.getByRole('button', { name: 'Tool' }));

  const answer = dialogs.alert({ title: 'Tool removed' });
  await expect.element(screen.getByRole('dialog')).toBeVisible();
  screen.component.hideTools();
  await userEvent.click(screen.getByRole('button', { name: 'OK' }));

  await expect(answer).resolves.toBeUndefined();
  await expect.element(screen.getByRole('main')).toHaveFocus();
});
