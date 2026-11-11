import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ByteSize from '../../src/lib/formatting/ByteSize.svelte';

test('renders <data value> with the short form hidden and the long form read', async () => {
  const screen = await render(ByteSize, { bytes: 4_200_000, locales: 'en-AU', id: 'size' });

  const data = screen.container.querySelector('data');
  expect(data?.getAttribute('value')).toBe('4200000');
  expect(data?.id).toBe('size');
  await expect.element(screen.getByText('4.2 MB')).toHaveAttribute('aria-hidden', 'true');
  await expect.element(screen.getByText('4.2 megabytes')).toHaveClass('sr-only');
});

test('a long unitDisplay is read as shown, once', async () => {
  const screen = await render(ByteSize, {
    bytes: 4_200_000,
    locales: 'en-AU',
    unitDisplay: 'long',
  });

  const data = screen.container.querySelector('data');
  expect(data?.textContent?.trim()).toBe('4.2 megabytes');
  expect(data?.querySelector('[aria-hidden]')).toBeNull();
});

test('memory style reads the IEC long name', async () => {
  const screen = await render(ByteSize, { bytes: 1_048_576, style: 'memory', locales: 'en-AU' });

  await expect.element(screen.getByText('1 MiB')).toHaveAttribute('aria-hidden', 'true');
  await expect.element(screen.getByText('1 mebibyte')).toBeInTheDocument();
});

test('includeExact adds the count as a title and to the read text', async () => {
  const screen = await render(ByteSize, { bytes: 4_200_000, locales: 'en-AU', includeExact: true });

  const data = screen.container.querySelector('data');
  expect(data?.getAttribute('title')).toBe('4,200,000 bytes');
  await expect.element(screen.getByText('4.2 megabytes, 4,200,000 bytes')).toBeInTheDocument();
});

test('spellOutZero and NaN', async () => {
  const zero = await render(ByteSize, { bytes: 0, spellOutZero: true, locales: 'en-AU' });
  expect(zero.container.querySelector('data')?.textContent?.trim()).toBe('Zero bytes');

  const nan = await render(ByteSize, { bytes: Number.NaN });
  const data = nan.container.querySelectorAll('data')[1] ?? nan.container.querySelector('data');
  expect(data?.textContent?.trim()).toBe('');
});
