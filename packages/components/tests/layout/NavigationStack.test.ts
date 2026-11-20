import { afterEach, expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import { NavigationStackState } from '../../src/lib/layout/stack-direction.svelte.ts';
import NavigationStackFixture from './fixtures/NavigationStackFixture.svelte';

const destination = (path: string) => ({ url: new URL(path, location.href) });

afterEach(() => {
  Reflect.deleteProperty(document, 'startViewTransition');
});

test('the root screen has no Back link; a pushed one names where Back goes', async () => {
  const screen = await render(NavigationStackFixture);

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Beds' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Back/ }).elements()).toHaveLength(0);

  await userEvent.click(screen.getByRole('link', { name: 'Bed 4' }));
  const back = screen.getByRole('link', { name: 'Back to Beds' });
  await expect.element(back).toHaveAttribute('href', '/beds');
  await expect.element(back).toHaveTextContent('Beds');
});

test('a push focuses the new screen’s title', async () => {
  const screen = await render(NavigationStackFixture);

  await userEvent.click(screen.getByRole('link', { name: 'Bed 4' }));

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Bed 4' })).toHaveFocus();
});

test('a pop by the Back link returns focus to the row the reader opened', async () => {
  const screen = await render(NavigationStackFixture);

  await userEvent.click(screen.getByRole('link', { name: 'Bed 4' }));
  await expect.element(screen.getByRole('heading', { level: 1, name: 'Bed 4' })).toHaveFocus();
  await userEvent.click(screen.getByRole('link', { name: 'Back to Beds' }));

  await expect.element(screen.getByRole('link', { name: 'Bed 4' })).toHaveFocus();
});

test('browser Back is a pop too', async () => {
  const screen = await render(NavigationStackFixture);

  await userEvent.click(screen.getByRole('link', { name: 'Bed 3' }));
  await expect.element(screen.getByRole('heading', { level: 1, name: 'Bed 3' })).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Browser back' }));

  await expect.element(screen.getByRole('link', { name: 'Bed 3' })).toHaveFocus();
});

test('without view transitions, navigation is instant and focus behaves the same', async () => {
  Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true });
  const screen = await render(NavigationStackFixture);

  await userEvent.click(screen.getByRole('link', { name: 'Bed 4' }));
  await expect.element(screen.getByRole('heading', { level: 1, name: 'Bed 4' })).toHaveFocus();
  expect(document.documentElement.dataset['stackDirection']).toBeUndefined();
  await userEvent.click(screen.getByRole('link', { name: 'Back to Beds' }));
  await expect.element(screen.getByRole('link', { name: 'Bed 4' })).toHaveFocus();
});

test('the direction is on the root for the length of the transition', async () => {
  const stack = new NavigationStackState();
  const { promise: complete, resolve: done } = Promise.withResolvers<void>();

  const started = stack.onNavigate({
    type: 'popstate',
    delta: -1,
    to: { url: new URL('/beds', location.href) },
    complete,
  });
  expect(stack.direction).toBe('pop');
  expect(document.documentElement.dataset['stackDirection']).toBe('pop');
  await started;
  done();
  await stack.settled();
  expect(document.documentElement.dataset['stackDirection']).toBeUndefined();
});

test('a link is a push unless it goes where the current page’s Back goes', () => {
  const stack = new NavigationStackState();
  const complete = Promise.resolve();

  expect(stack.directionOf({ type: 'link', to: destination('/beds/4'), complete })).toBe('push');
  stack.enter({ title: 'Bed 4', backHref: '/beds', backLink: () => undefined });
  expect(stack.directionOf({ type: 'link', to: destination('/beds'), complete })).toBe('pop');
  expect(
    stack.directionOf({ type: 'popstate', delta: 1, to: destination('/beds/4'), complete }),
  ).toBe('push');
});

test('a touch swipe from the leading edge goes back', async () => {
  const screen = await render(NavigationStackFixture);
  await userEvent.click(screen.getByRole('link', { name: 'Bed 4' }));
  await expect.element(screen.getByRole('heading', { level: 1, name: 'Bed 4' })).toHaveFocus();

  const frame = screen
    .getByRole('heading', { level: 1, name: 'Bed 4' })
    .element()
    .closest('section')?.parentElement;
  if (!frame) throw new Error('no frame');
  const { left, top } = frame.getBoundingClientRect();
  const touch = (type: string, x: number) =>
    frame.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 3,
        pointerType: 'touch',
        clientX: left + x,
        clientY: top + 40,
      }),
    );
  touch('pointerdown', 4);
  touch('pointermove', 60);
  touch('pointermove', 120);

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Beds' })).toBeInTheDocument();
});
