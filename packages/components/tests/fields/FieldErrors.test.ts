import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FieldErrors from '../../src/lib/fields/FieldErrors.svelte';

test('one alert region holds one paragraph per message', async () => {
  const screen = await render(FieldErrors, {
    errors: ['The genus must be capitalised.', 'The epithet must not be.'],
  });

  const alert = screen.getByRole('alert');
  expect(alert.element().querySelectorAll('p')).toHaveLength(2);
  await expect.element(alert).toHaveTextContent('The genus must be capitalised.');
});

test('the region carries the id a control points aria-describedby at', async () => {
  const screen = await render(FieldErrors, {
    errors: ['That name is already recorded.'],
    id: 'taxon-name-error',
  });

  await expect.element(screen.getByRole('alert')).toHaveAttribute('id', 'taxon-name-error');
});

test('an empty list renders nothing at all', async () => {
  const screen = await render(FieldErrors, { errors: [] });

  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});

test('duplicate messages are both rendered', async () => {
  const screen = await render(FieldErrors, { errors: ['Too long.', 'Too long.'] });

  expect(screen.getByRole('alert').element().querySelectorAll('p')).toHaveLength(2);
});
