import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import EmailLink from '../../src/lib/links/EmailLink.svelte';

test('renders a plain mailto: link with the address as the accessible name', async () => {
  const screen = await render(EmailLink, { email: 'hello@thomasfoster.au' });

  const link = screen.getByRole('link', { name: 'hello@thomasfoster.au' });
  await expect.element(link).toHaveAttribute('href', 'mailto:hello@thomasfoster.au');
});

test('builds the query string from subject/body/cc/bcc via URLSearchParams', async () => {
  const screen = await render(EmailLink, {
    email: 'hello@thomasfoster.au',
    subject: 'Question about your garden',
    body: 'Hi there,',
    cc: 'team@thomasfoster.au',
    bcc: 'archive@thomasfoster.au',
  });

  const link = screen.getByRole('link', { name: 'hello@thomasfoster.au' });
  const params = new URLSearchParams({
    subject: 'Question about your garden',
    body: 'Hi there,',
    cc: 'team@thomasfoster.au',
    bcc: 'archive@thomasfoster.au',
  });
  await expect
    .element(link)
    .toHaveAttribute('href', `mailto:hello@thomasfoster.au?${params.toString()}`);
});

test('children replaces the link text', async () => {
  const children = createRawSnippet(() => ({
    render: () => '<span>Contact us</span>',
  }));

  const screen = await render(EmailLink, { email: 'hello@thomasfoster.au', children });

  const link = screen.getByRole('link', { name: 'Contact us' });
  await expect.element(link).toBeInTheDocument();
});

test('merges the caller class and spreads native anchor attributes', async () => {
  const screen = await render(EmailLink, {
    email: 'hello@thomasfoster.au',
    class: 'text-lg',
    'data-testid': 'email-link',
  });

  const element = screen.getByTestId('email-link');
  await expect.element(element).toHaveClass('link');
  await expect.element(element).toHaveClass('text-lg');
});
