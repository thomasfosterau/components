import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PushToggle from '../../src/lib/fields/PushToggle.svelte';

const base = {
  available: true,
  supported: true,
  readSubscribed: async () => false,
  enable: async () => ({ _tag: 'enabled' as const }),
  disable: async () => undefined,
};

test('offers no switch when the site has no push configuration', async () => {
  const screen = await render(PushToggle, { ...base, available: false });
  await expect
    .element(screen.getByText("Push notifications aren't available on this site yet."))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[role="switch"]')).toBeNull();
});

test('reads the current subscription on mount', async () => {
  const screen = await render(PushToggle, { ...base, readSubscribed: async () => true });
  await expect
    .element(screen.getByRole('switch', { name: 'Send push notifications to this browser' }))
    .toBeChecked();
});

test('enabling calls enable with an AbortSignal and turns the switch on', async () => {
  const enable = vi.fn(async (_signal: AbortSignal) => ({ _tag: 'enabled' as const }));
  const screen = await render(PushToggle, { ...base, enable });
  const control = screen.getByRole('switch');
  await control.click();
  await expect.element(control).toBeChecked();
  expect(enable).toHaveBeenCalledOnce();
  expect(enable.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
});

test('a denied permission leaves the switch off and says why', async () => {
  const screen = await render(PushToggle, {
    ...base,
    enable: async () => ({ _tag: 'denied' as const }),
  });
  const control = screen.getByRole('switch');
  await control.click();
  await expect.element(screen.getByText(/blocking notifications/)).toBeInTheDocument();
  await expect.element(control).not.toBeChecked();
});

test('disabling calls disable and turns the switch off', async () => {
  const disable = vi.fn(async () => undefined);
  const screen = await render(PushToggle, { ...base, readSubscribed: async () => true, disable });
  const control = screen.getByRole('switch');
  await expect.element(control).toBeChecked();
  await control.click();
  await expect.element(control).not.toBeChecked();
  expect(disable).toHaveBeenCalledOnce();
});

test('an unsupported browser gets a disabled switch and its own message', async () => {
  const screen = await render(PushToggle, { ...base, supported: false });
  await expect.element(screen.getByRole('switch')).toBeDisabled();
  await expect
    .element(screen.getByText("This browser can't receive push notifications."))
    .toBeInTheDocument();
});

test('every string is a prop', async () => {
  const screen = await render(PushToggle, {
    ...base,
    label: 'Notificaciones en este navegador',
    enable: async () => ({ _tag: 'unavailable' as const }),
    unavailableMessage: 'No disponible.',
  });
  await screen.getByRole('switch', { name: 'Notificaciones en este navegador' }).click();
  await expect.element(screen.getByText('No disponible.')).toBeInTheDocument();
});
