import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ConsentSettings from '../../src/lib/feedback/ConsentSettings.svelte';
import { createConsent } from '../../src/lib/feedback/consent.svelte.ts';

const CATEGORIES = [
  { id: 'necessary', label: 'Necessary cookies', required: true },
  { id: 'analytics', label: 'Analytics cookies', description: 'How you use the planner.' },
];

test('a required category is on and disabled', async () => {
  const consent = createConsent({ categories: CATEGORIES });
  const screen = await render(ConsentSettings, { consent });

  const necessary = screen.getByRole('switch', { name: 'Necessary cookies' });
  await expect.element(necessary).toBeChecked();
  await expect.element(necessary).toBeDisabled();
  await expect.element(screen.getByRole('switch', { name: 'Analytics cookies' })).not.toBeChecked();
});

test('saving the switches updates the choice and says so', async () => {
  const consent = createConsent({ categories: CATEGORIES, read: () => ({ analytics: false }) });
  const screen = await render(ConsentSettings, { consent });

  await expect.element(screen.getByRole('form', { name: 'Cookie settings' })).toBeInTheDocument();
  await screen.getByRole('switch', { name: 'Analytics cookies' }).click();
  expect(consent.hasConsent('analytics')).toBe(false);
  await screen.getByRole('button', { name: 'Save cookie settings' }).click();

  expect(consent.choice).toEqual({ necessary: true, analytics: true });
  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('Your cookie settings were saved.');
});

test('withdrawing consent is as easy as giving it', async () => {
  const consent = createConsent({ categories: CATEGORIES, read: () => ({ analytics: true }) });
  const screen = await render(ConsentSettings, { consent });

  const analytics = screen.getByRole('switch', { name: 'Analytics cookies' });
  await expect.element(analytics).toBeChecked();
  await analytics.click();
  await screen.getByRole('button', { name: 'Save cookie settings' }).click();

  expect(consent.hasConsent('analytics')).toBe(false);
});
