import { expect, test } from 'vite-plus/test';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import Hero from '../../src/lib/layout/Hero.svelte';

const actions = createRawSnippet(() => ({
  render: () =>
    '<span><a href="/start">Start planning</a> <a href="/tour">Take the tour</a></span>',
}));
const figure = createRawSnippet(() => ({
  render: () => '<img src="data:," alt="A raised bed of lettuces" />',
}));

test('is a region named by its level-1 heading', async () => {
  const screen = await render(Hero, {
    title: 'Grow more with less',
    description: 'Plan beds by the season.',
  });

  const region = screen.getByRole('region', { name: 'Grow more with less' });
  await expect.element(region).toBeInTheDocument();
  await expect
    .element(region.getByRole('heading', { level: 1, name: 'Grow more with less' }))
    .toBeInTheDocument();
  await expect.element(screen.getByText('Plan beds by the season.')).toBeVisible();
});

test('headingLevel changes the heading level', async () => {
  const screen = await render(Hero, { title: 'Grow more with less', headingLevel: 2 });

  await expect
    .element(screen.getByRole('heading', { level: 2, name: 'Grow more with less' }))
    .toBeInTheDocument();
});

test('the call-to-action row is a group named Actions', async () => {
  const screen = await render(Hero, { title: 'Grow more with less', actions });

  const group = screen.getByRole('group', { name: 'Actions' });
  await expect.element(group.getByRole('link', { name: 'Start planning' })).toBeInTheDocument();
  await expect.element(group.getByRole('link', { name: 'Take the tour' })).toBeInTheDocument();
});

test('a background image is decorative CSS under an overlay, never an img', async () => {
  const screen = await render(Hero, {
    title: 'Grow more with less',
    backgroundImage: '/garden (1).jpg',
  });

  const region = screen
    .getByRole('region', { name: 'Grow more with less' })
    .element() as HTMLElement;
  expect(region.querySelector('img')).toBeNull();
  expect(region.querySelector('.hero-overlay')).not.toBeNull();
  expect(region.style.backgroundImage).toContain('garden (1).jpg');
  expect(screen.getByRole('img').elements()).toHaveLength(0);
});

test('a figure sits beside start-aligned copy; class merges last on the root', async () => {
  const screen = await render(Hero, {
    title: 'Grow more with less',
    figure,
    class: 'min-h-screen',
  });

  await expect
    .element(screen.getByRole('img', { name: 'A raised bed of lettuces' }))
    .toBeInTheDocument();
  const region = screen.getByRole('region').element();
  expect([...region.classList].at(-1)).toBe('min-h-screen');
  expect(region.querySelector('.hero-content')?.classList.contains('text-center')).toBe(false);
});
