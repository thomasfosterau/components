import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import VisuallyHidden from '../src/lib/ui/VisuallyHidden.svelte';

/**
 * `children` is a snippet, and a `.ts` test has no template to declare one in
 * — `createRawSnippet` is Svelte's own escape hatch for exactly this. The
 * returned fragment must be a single element, so the text is wrapped.
 */
const children = createRawSnippet(() => ({
  render: () => '<span>3 out of 5 stars</span>',
}));

test('renders its children into the accessibility tree', async () => {
  const screen = await render(VisuallyHidden, { children });

  await expect.element(screen.getByText('3 out of 5 stars')).toBeInTheDocument();
});

test('carries the sr-only class and merges the caller’s', async () => {
  const screen = await render(VisuallyHidden, {
    children,
    class: 'focus:not-sr-only',
    'data-testid': 'vh',
  });

  const element = screen.getByTestId('vh');
  await expect.element(element).toHaveClass('sr-only');
  await expect.element(element).toHaveClass('focus:not-sr-only');
});

test('spreads native span attributes', async () => {
  const screen = await render(VisuallyHidden, {
    children,
    id: 'rating-description',
    'data-testid': 'vh',
  });

  await expect.element(screen.getByTestId('vh')).toHaveAttribute('id', 'rating-description');
});
