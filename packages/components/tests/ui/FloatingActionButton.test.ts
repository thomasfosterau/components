/**
 * A floating action button keeps its name in every state: collapsing an
 * extended one hides the label visually, never from assistive technology.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import FabFixture from './fixtures/FabFixture.svelte';

test('is a button named by its label, with only the icon visible by default', async () => {
  const screen = await render(FabFixture, {});

  const button = screen.getByRole('button', { name: 'New planting' });
  await expect.element(button).toHaveAttribute('type', 'button');
  expect(button.element().querySelector('.sr-only')?.textContent).toBe('New planting');
});

test('extended, shows the label; collapsed on scroll down, keeps the name', async () => {
  const container = document.createElement('div');
  container.style.cssText = 'height: 100px; overflow: auto';
  container.innerHTML = '<div style="height: 1000px"></div>';
  document.body.append(container);
  const screen = await render(FabFixture, {
    extended: true,
    collapseOnScroll: true,
    scrollContainer: container,
  });
  const button = screen.getByRole('button', { name: 'New planting' });
  expect(button.element().querySelector('.sr-only')).toBeNull();

  container.scrollTop = 200;
  container.dispatchEvent(new Event('scroll'));
  await expect
    .poll(() => button.element().querySelector('.sr-only')?.textContent)
    .toBe('New planting');

  container.scrollTop = 50;
  container.dispatchEvent(new Event('scroll'));
  await expect.poll(() => button.element().querySelector('.sr-only')).toBeNull();
  container.remove();
});

test('with href, is a link resolved through the context', async () => {
  const screen = await render(FabFixture, { href: '/plantings/new' });

  await expect
    .element(screen.getByRole('link', { name: 'New planting' }))
    .toHaveAttribute('href', '/plantings/new');
});

test('passes data attributes through and merges class last', async () => {
  const screen = await render(FabFixture, { class: 'my-fab', 'data-testid': 'fab' });

  await expect.element(screen.getByTestId('fab')).toHaveClass('btn', 'my-fab');
});
