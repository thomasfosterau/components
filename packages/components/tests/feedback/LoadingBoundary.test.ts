/**
 * `LoadingBoundary` — the four states, and the one that is the whole point:
 * `refreshing` keeps the children MOUNTED. The counter in the fixture proves
 * it, because its state only survives a subtree that was never torn down.
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import LoadingBoundary from '../../src/lib/feedback/LoadingBoundary.svelte';
import LoadingBoundaryFixture from './fixtures/LoadingBoundaryFixture.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>31 beds</p>' }));

test('ready renders the children and no chrome', async () => {
  const screen = await render(LoadingBoundary, { state: 'ready', children });

  await expect.element(screen.getByText('31 beds')).toBeInTheDocument();
  expect(screen.getByRole('status').elements()).toHaveLength(0);
});

test('a first read shows the loading chrome as a status, and no children', async () => {
  const screen = await render(LoadingBoundary, {
    state: 'loading',
    loadingLabel: 'Loading beds…',
    children,
  });

  await expect.element(screen.getByRole('status')).toHaveTextContent('Loading beds…');
  expect(screen.getByText('31 beds').elements()).toHaveLength(0);
});

test('a failure is announced assertively, and the page tone is an alert', async () => {
  const screen = await render(LoadingBoundary, {
    state: 'error',
    errorLabel: 'The beds didn’t load.',
    children,
  });

  await expect.element(screen.getByRole('alert')).toHaveTextContent('The beds didn’t load.');
  expect(screen.getByText('31 beds').elements()).toHaveLength(0);
});

test('the section tone degrades quietly, still as an alert', async () => {
  const screen = await render(LoadingBoundary, {
    state: 'error',
    tone: 'section',
    errorLabel: 'Observations didn’t load.',
    children,
  });

  const message = screen.getByRole('alert');
  await expect.element(message).toHaveTextContent('Observations didn’t load.');
  expect(message.element().tagName).toBe('P');
});

test('refreshing keeps the children mounted and announces the refresh politely', async () => {
  const screen = await render(LoadingBoundaryFixture, {
    state: 'ready',
    loadingLabel: 'Refreshing beds…',
  });

  await userEvent.click(screen.getByRole('button', { name: 'Count up' }));
  await userEvent.click(screen.getByRole('button', { name: 'Count up' }));
  await expect.element(screen.getByTestId('count')).toHaveTextContent('2');

  await screen.rerender({ state: 'refreshing', loadingLabel: 'Refreshing beds…' });

  // Still there, and still holding its own state: the subtree was not replaced.
  await expect.element(screen.getByTestId('count')).toHaveTextContent('2');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Refreshing beds…');
});

test('a first read after a refresh tears the children down again', async () => {
  const screen = await render(LoadingBoundaryFixture, { state: 'ready' });

  await userEvent.click(screen.getByRole('button', { name: 'Count up' }));
  await screen.rerender({ state: 'loading' });

  expect(screen.getByTestId('count').elements()).toHaveLength(0);
});

test('the loading and failed snippets replace the default chrome', async () => {
  const loading = createRawSnippet(() => ({ render: () => '<p>Shuffling seed packets…</p>' }));
  const screen = await render(LoadingBoundary, { state: 'loading', loading, children });

  await expect.element(screen.getByText('Shuffling seed packets…')).toBeInTheDocument();
  expect(screen.getByRole('status').elements()).toHaveLength(0);
});
