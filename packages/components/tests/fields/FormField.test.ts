import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FormFieldFixture from './fixtures/FormFieldFixture.svelte';

/**
 * The wiring is the whole component: one `id` becomes the label's `for`, the
 * control's `aria-describedby` and `aria-invalid`, and the error region's
 * `id`. These pin every strand of it.
 */

test('the label names the control through for/id', async () => {
  const screen = await render(FormFieldFixture, { id: 'taxon-name', label: 'Scientific name' });

  const input = screen.getByRole('textbox', { name: 'Scientific name' });
  await expect.element(input).toHaveAttribute('id', 'taxon-name');
});

test('an id is minted when none is given, and still ties label to control', async () => {
  const screen = await render(FormFieldFixture, { label: 'Scientific name' });

  const input = screen.getByRole('textbox', { name: 'Scientific name' }).element();
  const label = screen.container.querySelector('label');

  expect(input.id).not.toBe('');
  expect(label?.getAttribute('for')).toBe(input.id);
});

test('aria-describedby lists the hint id, and there is no error state', async () => {
  const screen = await render(FormFieldFixture, {
    id: 'taxon-name',
    label: 'Scientific name',
    hint: 'Genus and species, as published.',
  });

  const input = screen.getByRole('textbox', { name: 'Scientific name' });
  await expect.element(input).toHaveAttribute('aria-describedby', 'taxon-name-hint');
  await expect.element(input).not.toHaveAttribute('aria-invalid');
  await expect
    .element(screen.getByText('Genus and species, as published.'))
    .toHaveAttribute('id', 'taxon-name-hint');
});

test('aria-describedby lists BOTH the hint and the error ids, in reading order', async () => {
  const screen = await render(FormFieldFixture, {
    id: 'taxon-name',
    label: 'Scientific name',
    hint: 'Genus and species, as published.',
    errors: ['That name is already recorded.'],
  });

  const input = screen.getByRole('textbox', { name: 'Scientific name' });
  await expect
    .element(input)
    .toHaveAttribute('aria-describedby', 'taxon-name-hint taxon-name-error');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
});

test('the errors are one alert region holding one paragraph per message', async () => {
  const screen = await render(FormFieldFixture, {
    id: 'taxon-name',
    label: 'Scientific name',
    errors: ['The genus must be capitalised.', 'The epithet must not be.'],
  });

  const alert = screen.getByRole('alert');
  await expect.element(alert).toHaveAttribute('id', 'taxon-name-error');
  expect(alert.element().querySelectorAll('p')).toHaveLength(2);
  await expect.element(alert).toHaveTextContent('The genus must be capitalised.');
  await expect.element(alert).toHaveTextContent('The epithet must not be.');
});

test('no errors means no alert region at all', async () => {
  const screen = await render(FormFieldFixture, { label: 'Scientific name' });

  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});

test('required puts the requiredLabel in the accessible name and the * out of it', async () => {
  const screen = await render(FormFieldFixture, {
    label: 'Scientific name',
    required: true,
  });

  const input = screen.getByRole('textbox');
  await expect.element(input).toHaveAccessibleName('Scientific name (required)');
  await expect.element(input).toBeRequired();
});

test('requiredLabel is a prop', async () => {
  const screen = await render(FormFieldFixture, {
    label: 'Scientific name',
    required: true,
    requiredLabel: 'must be filled in',
  });

  await expect
    .element(screen.getByRole('textbox'))
    .toHaveAccessibleName('Scientific name must be filled in');
});
