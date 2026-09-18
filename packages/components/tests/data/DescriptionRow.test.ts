/**
 * `DescriptionRow` on its own, inside an app's own `<dl>`: it falls back to
 * the context defaults rather than throwing, which is what makes it usable
 * outside a `DescriptionList`. The empty rule is the behaviour worth pinning
 * — a row with nothing in it renders nothing at all.
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DescriptionRowFixture from './fixtures/DescriptionRowFixture.svelte';

test('renders a dt/dd pair for a value', async () => {
  const screen = await render(DescriptionRowFixture, { label: 'Formula', value: 'C8H10N4O2' });

  await expect.element(screen.getByText('Formula')).toBeInTheDocument();
  expect(document.querySelector('dt')?.textContent?.trim()).toBe('Formula');
  expect(document.querySelector('dd')?.textContent?.trim()).toBe('C8H10N4O2');
});

test('renders nothing at all when there is no value', async () => {
  await render(DescriptionRowFixture, { label: 'Collected' });

  expect(document.querySelectorAll('dt')).toHaveLength(0);
  expect(document.querySelectorAll('dd')).toHaveLength(0);
});

test('treats a blank string as no value', async () => {
  await render(DescriptionRowFixture, { label: 'Collected', value: '   ' });

  expect(document.querySelectorAll('dd')).toHaveLength(0);
});

test('keeps a zero, because 0 is a value', async () => {
  await render(DescriptionRowFixture, { label: 'Seedlings', value: 0 });

  expect(document.querySelector('dd')?.textContent?.trim()).toBe('0');
});

test('says what the absence is when the row asks to be shown', async () => {
  await render(DescriptionRowFixture, {
    label: 'Collected',
    showEmpty: true,
    emptyLabel: 'not recorded',
  });

  expect(document.querySelector('dd')?.textContent?.trim()).toBe('not recorded');
});

test('markup counts as a value even with no `value` prop', async () => {
  const screen = await render(DescriptionRowFixture, { label: 'Licence', withChildren: true });

  await expect.element(screen.getByRole('link', { name: 'CC BY 4.0' })).toBeInTheDocument();
});
