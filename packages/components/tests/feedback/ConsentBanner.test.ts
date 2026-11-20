import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import {
  cookieStorage,
  createConsent,
  parseConsentChoice,
  type ConsentChoice,
} from '../../src/lib/feedback/consent.svelte.ts';
import ConsentFixture from './fixtures/ConsentFixture.svelte';

const CATEGORIES = [
  { id: 'necessary', label: 'Necessary', required: true },
  { id: 'analytics', label: 'Analytics' },
  { id: 'video', label: 'Video embeds' },
];

const store = (stored?: ConsentChoice) => {
  const write = vi.fn<(choice: ConsentChoice | undefined) => void>();
  const consent = createConsent({ categories: CATEGORIES, read: () => stored, write });
  return { consent, write };
};

test('with no stored choice the banner is a region named by its heading', async () => {
  const { consent } = store();
  const screen = await render(ConsentFixture, { consent });

  await expect
    .element(screen.getByRole('region', { name: 'Cookies on this site' }))
    .toBeInTheDocument();
  expect(screen.getByRole('dialog').elements()).toHaveLength(0);
});

test('with a stored choice there is no banner', async () => {
  const { consent } = store({ analytics: false });
  const screen = await render(ConsentFixture, { consent });

  await expect.element(screen.getByRole('heading', { name: 'Garden planner' })).toBeInTheDocument();
  expect(screen.getByRole('region').elements()).toHaveLength(0);
});

test('Accept and Reject have identical classes', async () => {
  const { consent } = store();
  const screen = await render(ConsentFixture, { consent });

  const accept = screen.getByRole('button', { name: 'Accept analytics cookies' }).element();
  const reject = screen.getByRole('button', { name: 'Reject analytics cookies' }).element();
  expect(accept.className).toBe(reject.className);
});

test('Accept allows every category and focuses the confirmation', async () => {
  const { consent, write } = store();
  const screen = await render(ConsentFixture, { consent });

  await screen.getByRole('button', { name: 'Accept analytics cookies' }).click();

  expect(write).toHaveBeenCalledWith({ necessary: true, analytics: true, video: true });
  expect(consent.hasConsent('analytics')).toBe(true);
  const confirmation = screen.getByRole('region', { name: 'Cookies on this site' });
  await expect.element(confirmation).toHaveFocus();
  await expect.element(confirmation).toHaveTextContent('You’ve accepted analytics cookies.');
});

test('Reject allows only the required categories', async () => {
  const { consent, write } = store();
  const screen = await render(ConsentFixture, { consent });

  await screen.getByRole('button', { name: 'Reject analytics cookies' }).click();

  expect(write).toHaveBeenCalledWith({ necessary: true, analytics: false, video: false });
  expect(consent.hasConsent('necessary')).toBe(true);
  expect(consent.hasConsent('video')).toBe(false);
});

test('Hide removes the confirmation and moves focus to main', async () => {
  const { consent } = store();
  const screen = await render(ConsentFixture, { consent, settingsHref: '/cookies' });

  await screen.getByRole('button', { name: 'Reject analytics cookies' }).click();
  await expect
    .element(screen.getByRole('link', { name: 'Change your cookie settings' }))
    .toHaveAttribute('href', '/cookies');
  await screen.getByRole('button', { name: 'Hide this message' }).click();

  expect(screen.getByRole('region').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('main')).toHaveFocus();
});

test('with action, the buttons post consent=accept or reject from a form', async () => {
  const { consent } = store();
  const screen = await render(ConsentFixture, { consent, action: '/cookies' });

  const form = screen.container.querySelector('form');
  expect(form?.getAttribute('method')).toBe('post');
  expect(form?.getAttribute('action')).toBe('/cookies');
  const accept = screen.getByRole('button', { name: 'Accept analytics cookies' }).element();
  if (form === null || !(accept instanceof HTMLButtonElement)) throw new Error('no form');
  expect(new FormData(form, accept).get('consent')).toBe('accept');

  await screen.getByRole('button', { name: 'Reject analytics cookies' }).click();
  expect(consent.choice).toEqual({ necessary: true, analytics: false, video: false });
});

test('category() is live, and granting keeps the rest of the choice', () => {
  const { consent } = store({ analytics: true });
  const video = consent.category('video');

  expect(video.granted).toBe(false);
  video.grant();
  expect(video.granted).toBe(true);
  expect(consent.choice).toEqual({ necessary: true, analytics: true, video: true });
  consent.reset();
  expect(consent.choice).toBeUndefined();
  expect(consent.hasConsent('necessary')).toBe(true);
});

test('cookieStorage round-trips a choice, and parse rejects junk', () => {
  const { read, write } = cookieStorage('test-consent');

  write({ analytics: true });
  expect(read()).toEqual({ analytics: true });
  write(undefined);
  expect(read()).toBeUndefined();
  expect(parseConsentChoice('%7B%22a%22%3A1%7D')).toBeUndefined();
  expect(parseConsentChoice('not json')).toBeUndefined();
});
