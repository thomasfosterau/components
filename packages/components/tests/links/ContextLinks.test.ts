import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ContextLinks from '../../src/lib/links/ContextLinks.svelte';
import ContextLinksFixture from './fixtures/ContextLinksFixture.svelte';

const links = [
  { href: '/taxa/rosa-canina', label: 'Rosa canina' },
  { href: '/beds/4', label: 'Bed 4' },
];

test('renders the label and one link per item, named by its text', async () => {
  const screen = await render(ContextLinks, { links });
  await expect.element(screen.getByText('About:')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('link', { name: 'Rosa canina' }))
    .toHaveAttribute('href', '/taxa/rosa-canina');
  await expect.element(screen.getByRole('link', { name: 'Bed 4' })).toBeInTheDocument();
});

test('resolves hrefs through the components context', async () => {
  const screen = await render(ContextLinksFixture, { links });
  await expect
    .element(screen.getByRole('link', { name: 'Bed 4' }))
    .toHaveAttribute('href', '/en/beds/4');
});

test('takes its label as a prop', async () => {
  const screen = await render(ContextLinks, { links, label: 'Acerca de' });
  await expect.element(screen.getByText('Acerca de:')).toBeInTheDocument();
});

test('renders nothing at all for no links', async () => {
  const screen = await render(ContextLinks, { links: [] });
  expect(screen.container.querySelector('p')).toBeNull();
});

test('spreads attributes and merges class', async () => {
  const screen = await render(ContextLinks, { links, id: 'about', class: 'mt-2' });
  const p = screen.container.querySelector('p');
  expect(p?.id).toBe('about');
  expect(p).toHaveClass('mt-2');
  expect(p).toHaveClass('text-sm');
});
