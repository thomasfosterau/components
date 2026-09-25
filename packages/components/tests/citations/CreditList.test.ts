import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CreditList from '../../src/lib/citations/CreditList.svelte';

test('renders nothing for an empty list', async () => {
  const screen = await render(CreditList, { credits: [], role: 'editor' });
  await expect.element(screen.getByText('(ed)')).not.toBeInTheDocument();
});

test('joins two authors with the locale conjunction and no role label', async () => {
  const screen = await render(CreditList, {
    credits: [{ name: 'Smith, J.' }, { name: 'Jones, A.' }],
    role: 'author',
  });
  await expect.element(screen.getByText('Smith, J.')).toBeInTheDocument();
  await expect.element(screen.getByText('and', { exact: false })).toBeInTheDocument();
  await expect.element(screen.getByText('Jones, A.')).toBeInTheDocument();
  await expect.element(screen.getByText('(ed)')).not.toBeInTheDocument();
});

test('prints "(ed)" after a single editor, "(eds)" after several', async () => {
  const one = await render(CreditList, { credits: [{ name: 'Harden, G. J.' }], role: 'editor' });
  await expect.element(one.getByText('(ed)')).toBeInTheDocument();

  const many = await render(CreditList, {
    credits: [{ name: 'Harden, G. J.' }, { name: 'Second, E.' }],
    role: 'editor',
  });
  await expect.element(many.getByText('(eds)')).toBeInTheDocument();
});

test('prints "trans." before the translator names', async () => {
  const screen = await render(CreditList, {
    credits: [{ name: 'Dubois, M.' }],
    role: 'translator',
  });
  await expect.element(screen.getByText('trans.', { exact: false })).toBeInTheDocument();
});

test('renders a resolved credit as Person microdata, linked', async () => {
  const screen = await render(CreditList, {
    credits: [{ name: 'Harden, G. J.', href: '/people/harden-g', itemtype: 'Person' }],
    role: 'author',
  });
  const link = screen.getByRole('link', { name: 'Harden, G. J.' });
  await expect.element(link).toBeInTheDocument();
  await expect.element(link).toHaveAttribute('itemprop', 'name');
});

test('renders an unresolved credit as plain text with no link and no microdata scope', async () => {
  const screen = await render(CreditList, {
    credits: [{ name: 'Unknown collector' }],
    role: 'author',
  });
  await expect.element(screen.getByText('Unknown collector')).toBeInTheDocument();
  await expect.element(screen.getByRole('link')).not.toBeInTheDocument();
});

test('a caller-supplied roleLabel and position override the built-in defaults', async () => {
  const screen = await render(CreditList, {
    credits: [{ name: 'García, R.' }],
    role: 'illustrator',
    roleLabel: () => '(illus.)',
    roleLabelPosition: 'after',
  });
  await expect.element(screen.getByText('(illus.)')).toBeInTheDocument();
});
