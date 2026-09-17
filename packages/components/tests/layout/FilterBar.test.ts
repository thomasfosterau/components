import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FilterBar from '../../src/lib/layout/FilterBar.svelte';

const options = [
  { key: 'all', label: 'All', href: '/datasets', active: false },
  { key: 'published', label: 'Published', href: '/datasets?status=published', active: true },
  { key: 'draft', label: 'Draft', href: '/datasets?status=draft', active: false },
];

test('is a navigation landmark named for the axis it filters on', async () => {
  const screen = await render(FilterBar, { options, label: 'Filter by status' });

  await expect
    .element(screen.getByRole('navigation', { name: 'Filter by status' }))
    .toBeInTheDocument();
});

test('every option is a real link carrying the page-supplied href', async () => {
  const screen = await render(FilterBar, { options, label: 'Filter by status' });

  expect(screen.getByRole('link').elements()).toHaveLength(3);
  await expect
    .element(screen.getByRole('link', { name: 'Draft' }))
    .toHaveAttribute('href', '/datasets?status=draft');
});

test('the active option says so out loud, not only in colour', async () => {
  const screen = await render(FilterBar, { options, label: 'Filter by status' });

  const active = screen.getByRole('link', { name: 'Published' });
  await expect.element(active).toHaveAttribute('aria-current', 'page');
  await expect.element(active).toHaveClass('btn-active');

  const inactive = screen.getByRole('link', { name: 'All' }).element();
  expect(inactive).not.toHaveAttribute('aria-current');
  expect(inactive).not.toHaveClass('btn-active');
});
