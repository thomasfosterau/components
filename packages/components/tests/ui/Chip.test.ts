import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Chip from '../../src/lib/ui/Chip.svelte';

test('exposes the expansion through abbr, and hides the swatch', async () => {
  const screen = await render(Chip, { label: 'EVG', title: 'Evergreen', 'data-testid': 'chip' });

  await expect.element(screen.getByText('EVG')).toHaveAttribute('title', 'Evergreen');
  // The swatch repeats the colour and says nothing on its own.
  await expect.element(screen.getByTestId('chip')).toHaveTextContent('EVG');
});

test('renders a link when href is given, named by the code', async () => {
  const screen = await render(Chip, {
    label: 'EVG',
    title: 'Evergreen',
    href: '/traits/evergreen',
  });

  await expect
    .element(screen.getByRole('link', { name: 'EVG' }))
    .toHaveAttribute('href', '/traits/evergreen');
});

test('without a title there is no abbr to expand', async () => {
  const screen = await render(Chip, { label: 'UNK', 'data-testid': 'chip' });

  await expect.element(screen.getByText('UNK')).not.toHaveAttribute('title');
});

test('binds the chip colour custom property', async () => {
  const screen = await render(Chip, {
    label: 'EVG',
    colourToken: '--demo-ever',
    'data-testid': 'chip',
  });

  expect(screen.getByTestId('chip').element().getAttribute('style')).toContain(
    '--chip-colour: var(--demo-ever, var(--color-neutral))',
  );
});
