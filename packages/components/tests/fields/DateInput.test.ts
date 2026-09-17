import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DateInput from '../../src/lib/fields/DateInput.svelte';

test('is a native date control holding an ISO calendar date', async () => {
  const screen = await render(DateInput, {
    'aria-label': 'Sown on',
    value: '2026-09-14',
    'data-testid': 'sown',
  });

  const input = screen.getByTestId('sown');
  await expect.element(input).toHaveAttribute('type', 'date');
  await expect.element(input).toHaveValue('2026-09-14');
});

test('min and max bound the control', async () => {
  const screen = await render(DateInput, {
    'aria-label': 'Observed on',
    value: '2026-03-02',
    min: '2020-01-01',
    max: '2026-09-17',
    'data-testid': 'observed',
  });

  const input = screen.getByTestId('observed');
  await expect.element(input).toHaveAttribute('min', '2020-01-01');
  await expect.element(input).toHaveAttribute('max', '2026-09-17');
});

test('the FieldControl wiring becomes aria-describedby and aria-invalid', async () => {
  const screen = await render(DateInput, {
    id: 'sown',
    'aria-label': 'Sown on',
    describedBy: 'sown-error',
    invalid: true,
    'data-testid': 'sown',
  });

  const input = screen.getByTestId('sown');
  await expect.element(input).toHaveAttribute('aria-describedby', 'sown-error');
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveClass('input-error');
});
