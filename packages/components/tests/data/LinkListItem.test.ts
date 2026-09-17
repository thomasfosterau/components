/**
 * `LinkListItem` is the row body most lists want. Its contract is that the
 * title is the row's ONLY interactive element — the subtitle and the badges
 * are text beside it, not a second target for a keyboard reader to pass
 * through on the way to the next row.
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LinkListItem from '../../src/lib/data/LinkListItem.svelte';

test('is a link named by its title, with the subtitle and badges as text', async () => {
  const screen = await render(LinkListItem, {
    href: '/gardens/1',
    title: 'Back bed',
    subtitle: 'Nine beds, mostly brassicas',
    badges: ['Private', 'Watered'],
  });

  await expect
    .element(screen.getByRole('link', { name: 'Back bed' }))
    .toHaveAttribute('href', '/gardens/1');
  await expect.element(screen.getByText('Nine beds, mostly brassicas')).toBeInTheDocument();
  await expect.element(screen.getByText('Private')).toBeInTheDocument();
  expect(screen.getByRole('link').elements()).toHaveLength(1);
});

test('renders no heading unless one is asked for', async () => {
  const screen = await render(LinkListItem, { href: '/gardens/1', title: 'Back bed' });

  expect(screen.getByRole('heading').elements()).toHaveLength(0);
});

test('promotes the title to a real heading at the level given', async () => {
  const screen = await render(LinkListItem, {
    href: '/gardens/1',
    title: 'Back bed',
    headingLevel: 3,
  });

  const heading = screen.getByRole('heading', { name: 'Back bed', level: 3 });
  await expect.element(heading).toBeInTheDocument();
  // The link stays inside the heading, so the heading is navigable AND the
  // row is still one target.
  expect(heading.element().querySelector('a')).not.toBeNull();
});

test('omits the subtitle and the badge row entirely when there are none', async () => {
  const screen = await render(LinkListItem, {
    href: '/gardens/1',
    title: 'Back bed',
    badges: [],
    'data-testid': 'row',
  });

  expect(screen.getByTestId('row').element().querySelectorAll('p')).toHaveLength(0);
  expect(screen.getByTestId('row').element().querySelectorAll('.badge')).toHaveLength(0);
});
