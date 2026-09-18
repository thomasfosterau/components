import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import DateTime from '../../src/lib/formatting/DateTime.svelte';

const INSTANT = '2026-09-17T09:30:00.000Z';

test('renders the ISO instant in datetime and the formatted text (en-AU)', async () => {
  const screen = await render(DateTime, { value: INSTANT, locales: 'en-AU' });

  const time = screen.container.querySelector('time');
  expect(time).not.toBeNull();
  await expect.element(screen.getByText(/17/)).toBeInTheDocument();
  expect(time?.getAttribute('datetime')).toBe(new Date(INSTANT).toISOString());
});

test('formats in de-DE', async () => {
  const screen = await render(DateTime, {
    value: INSTANT,
    locales: 'de-DE',
    dateStyle: 'long',
  });

  const expected = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(
    new Date(INSTANT),
  );
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});

test('options wins over dateStyle/timeStyle when both are given', async () => {
  const screen = await render(DateTime, {
    value: INSTANT,
    locales: 'en-AU',
    dateStyle: 'full',
    options: { year: 'numeric', month: 'short' },
  });

  const expected = new Intl.DateTimeFormat('en-AU', { year: 'numeric', month: 'short' }).format(
    new Date(INSTANT),
  );
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});

test('children replaces the text but datetime stays machine-readable', async () => {
  const children = createRawSnippet(() => ({
    render: () => '<span>Published this year</span>',
  }));

  const screen = await render(DateTime, { value: INSTANT, children });

  await expect.element(screen.getByText('Published this year')).toBeInTheDocument();
  const time = screen.container.querySelector('time');
  expect(time?.getAttribute('datetime')).toBe(new Date(INSTANT).toISOString());
});
