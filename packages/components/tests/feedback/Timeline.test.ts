/**
 * `Timeline` — an ordered list whose spans read as ranges. The dash is
 * `aria-hidden` and `toLabel` is read in its place; an open-ended entry is
 * introduced by `currentLabel` rather than by the filled marker alone.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Timeline from '../../src/lib/feedback/Timeline.svelte';
import type { TimelineEntry } from '../../src/lib/feedback/Timeline.svelte';
import TimelineFixture from './fixtures/TimelineFixture.svelte';

const items: TimelineEntry[] = [
  {
    id: 'glasshouse',
    label: 'Glasshouse',
    subtitle: 'Tomatoes, chillies, basil',
    start: { label: 'March 2024', dateTime: '2024-03-01' },
    href: '/beds/glasshouse',
    colourToken: '--bed-glasshouse',
  },
  {
    id: 'north',
    label: 'North bed',
    start: { label: 'September 2022', dateTime: '2022-09-14' },
    end: { label: 'February 2024', dateTime: '2024-02-28' },
  },
];

test('renders an ordered, labelled list', async () => {
  const screen = await render(Timeline, { items, label: 'Beds this plant has grown in' });

  const list = screen.getByRole('list', { name: 'Beds this plant has grown in' });
  await expect.element(list).toBeInTheDocument();
  expect(list.element().tagName).toBe('OL');
  expect(screen.getByRole('listitem').elements()).toHaveLength(2);
});

test('an open-ended entry reads as current and ends at presentLabel', async () => {
  const screen = await render(Timeline, { items, presentLabel: 'still growing' });

  const [current, past] = screen.getByRole('listitem').elements();
  expect(current).toHaveTextContent('March 2024 – to still growing');
  expect(current).toHaveTextContent('Current');
  expect(past).not.toHaveTextContent('Current');
  expect(past).toHaveTextContent('September 2022 – to February 2024');
});

test('dates are machine-readable', async () => {
  const screen = await render(Timeline, { items });

  const [current, past] = screen.getByRole('listitem').elements();
  expect(current?.querySelector('time')).toHaveAttribute('datetime', '2024-03-01');
  expect(past?.querySelectorAll('time')).toHaveLength(2);
});

test('the entry label links through the context, and the subtitle renders', async () => {
  const screen = await render(Timeline, { items });

  await expect
    .element(screen.getByRole('link', { name: 'Glasshouse' }))
    .toHaveAttribute('href', '/beds/glasshouse');
  await expect.element(screen.getByText('Tomatoes, chillies, basil')).toBeInTheDocument();
  expect(screen.getByText('North bed').element().tagName).toBe('P');
});

test('a colourToken tints only the entry that has one', async () => {
  const screen = await render(Timeline, { items });

  const [current, past] = screen.getByRole('listitem').elements();
  expect(current?.getAttribute('style')).toContain('--timeline-colour: var(--bed-glasshouse');
  expect(current?.querySelector('.timeline-middle')?.className).toContain(
    'text-(--timeline-colour)',
  );
  expect(past).not.toHaveAttribute('style');
});

test('the wording of “to” and “current” are props', async () => {
  const screen = await render(Timeline, { items, toLabel: 'until', currentLabel: 'Now:' });

  const [current] = screen.getByRole('listitem').elements();
  expect(current).toHaveTextContent('March 2024 – until present');
  expect(current).toHaveTextContent('Now:');
});

test('the item snippet replaces the default box body', async () => {
  const screen = await render(TimelineFixture, { items });

  await expect.element(screen.getByTestId('custom-glasshouse')).toHaveTextContent('GLASSHOUSE');
  expect(screen.getByRole('link').elements()).toHaveLength(0);
});
