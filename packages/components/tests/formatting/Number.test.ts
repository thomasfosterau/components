import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import NumberFormat from '../../src/lib/formatting/Number.svelte';
import NumberForwarder from './fixtures/NumberForwarder.svelte';

test('renders the raw value in the value attribute and the formatted text (en-AU)', async () => {
  const screen = await render(NumberFormat, { value: 1234.5, locales: 'en-AU' });

  const data = screen.container.querySelector('data');
  expect(data?.getAttribute('value')).toBe('1234.5');
  const expected = new Intl.NumberFormat('en-AU').format(1234.5);
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});

test('formats currency in de-DE', async () => {
  const screen = await render(NumberFormat, {
    value: 42.5,
    locales: 'de-DE',
    style: 'currency',
    currency: 'EUR',
  });

  const expected = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    42.5,
  );
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});

test('supports bigint values', async () => {
  const screen = await render(NumberFormat, { value: 9007199254740993n, locales: 'en-AU' });

  const data = screen.container.querySelector('data');
  expect(data?.getAttribute('value')).toBe('9007199254740993');
});

test('options wins over the individual style props when given', async () => {
  const screen = await render(NumberFormat, {
    value: 0.5,
    locales: 'en-AU',
    style: 'currency',
    currency: 'AUD',
    options: { style: 'percent' },
  });

  const expected = new Intl.NumberFormat('en-AU', { style: 'percent' }).format(0.5);
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});

test('a wrapper forwarding its own unset optional props gets the defaults', async () => {
  // The fixture passes `style`, `maximumFractionDigits` and
  // `minimumFractionDigits` through as explicit `undefined`; that it compiles
  // at all is the type-level half of this test (#45).
  const screen = await render(NumberForwarder, { value: 1234.5678, locales: 'en-AU' });

  const expected = new Intl.NumberFormat('en-AU').format(1234.5678);
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});
