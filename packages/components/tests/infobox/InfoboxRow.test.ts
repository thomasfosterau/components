import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InfoboxRow from '../../src/lib/infobox/InfoboxRow.svelte';
import { htmlSnippet } from './snippets.ts';

test('renders a dt/dd pair for a plain value', async () => {
  const screen = await render(InfoboxRow, { label: 'Family', value: 'Solanaceae' });

  const dt = screen.container.querySelector('dt');
  const dd = screen.container.querySelector('dd');
  expect(dt?.textContent).toBe('Family');
  expect(dd?.textContent).toBe('Solanaceae');
});

test('keeps a numeric zero value', async () => {
  const screen = await render(InfoboxRow, { label: 'Margin', value: 0 });

  expect(screen.container.querySelector('dd')?.textContent).toBe('0');
});

test('prefers children over a plain value when both are given', async () => {
  const screen = await render(InfoboxRow, {
    label: 'Status',
    value: 'ignored',
    children: htmlSnippet('<span>Accepted</span>'),
  });

  await expect.element(screen.getByText('Accepted')).toBeInTheDocument();
  expect(screen.container.querySelector('dd')?.textContent).toBe('Accepted');
});

test('a row with nothing to show renders no DOM at all', async () => {
  const screen = await render(InfoboxRow, { label: 'Frost tolerance' });

  expect(screen.container.querySelector('dt')).toBeNull();
  expect(screen.container.querySelector('dd')).toBeNull();
  expect(screen.container.textContent).toBe('');
});

test('an empty string value is treated as absent', async () => {
  const screen = await render(InfoboxRow, { label: 'Nickname', value: '' });

  expect(screen.container.querySelector('dt')).toBeNull();
});

test('showEmpty renders the emptyLabel with an accessible name, instead of nothing', async () => {
  const screen = await render(InfoboxRow, { label: 'Frost tolerance', showEmpty: true });

  await expect.element(screen.getByText('Frost tolerance')).toBeInTheDocument();
  const placeholder = screen.getByLabelText('unrecorded');
  await expect.element(placeholder).toBeInTheDocument();
  await expect.element(placeholder).toHaveTextContent('—');
});

test('showEmpty honours a custom emptyLabel', async () => {
  const screen = await render(InfoboxRow, {
    label: 'ISBN',
    showEmpty: true,
    emptyLabel: 'not catalogued',
  });

  await expect.element(screen.getByLabelText('not catalogued')).toBeInTheDocument();
});

test('href wraps the value in a link resolved through the default context', async () => {
  const screen = await render(InfoboxRow, {
    label: 'Genus',
    value: 'Solanum',
    href: '/taxa/solanum',
  });

  const link = screen.getByRole('link', { name: 'Solanum' });
  await expect.element(link).toHaveAttribute('href', '/taxa/solanum');
});

test('href + external opens the link in a new tab', async () => {
  const screen = await render(InfoboxRow, {
    label: 'Source',
    value: 'iNaturalist',
    href: 'https://inaturalist.org',
    external: true,
  });

  const link = screen.getByRole('link', { name: 'iNaturalist' });
  await expect.element(link).toHaveAttribute('target', '_blank');
  await expect.element(link).toHaveAttribute('rel', 'noreferrer');
});

test('spreads native attributes and merges class onto the row', async () => {
  const screen = await render(InfoboxRow, {
    label: 'Family',
    value: 'Solanaceae',
    class: 'my-row',
    'data-testid': 'row',
  });

  const element = screen.getByTestId('row');
  await expect.element(element).toHaveClass('my-row');
});
