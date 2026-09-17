import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FieldsetFixture from './fixtures/FieldsetFixture.svelte';

test('the legend names the group', async () => {
  const screen = await render(FieldsetFixture, { legend: 'Growing conditions' });

  await expect
    .element(screen.getByRole('group', { name: /Growing conditions/ }))
    .toBeInTheDocument();
});

test('the hint and the errors are described from the fieldset, not from each box', async () => {
  const screen = await render(FieldsetFixture, {
    legend: 'Growing conditions',
    hint: 'Tick everything this plant tolerates.',
    errors: ['Choose at least one condition.'],
  });

  const group = screen.getByRole('group', { name: /Growing conditions/ }).element();
  const describedBy = group.getAttribute('aria-describedby') ?? '';
  const [hintId, errorId] = describedBy.split(' ');

  expect(describedBy.split(' ')).toHaveLength(2);
  expect(document.getElementById(hintId ?? '')?.textContent).toBe(
    'Tick everything this plant tolerates.',
  );
  expect(document.getElementById(errorId ?? '')?.getAttribute('role')).toBe('alert');
});

test('required reads out after the legend and marks the group', async () => {
  const screen = await render(FieldsetFixture, { legend: 'Growing conditions', required: true });

  const group = screen.getByRole('group', { name: 'Growing conditions (required)' });
  await expect.element(group).toBeInTheDocument();
});

test('a group with nothing to say carries no aria-describedby', async () => {
  const screen = await render(FieldsetFixture, { legend: 'Growing conditions' });

  await expect
    .element(screen.getByRole('group', { name: /Growing conditions/ }))
    .not.toHaveAttribute('aria-describedby');
});
