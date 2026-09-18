import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CheckboxGroup from '../../src/lib/fields/CheckboxGroup.svelte';

const CONDITIONS = [
  { value: 'full-sun', label: 'Full sun' },
  { value: 'part-shade', label: 'Part shade' },
  { value: 'bog', label: 'Permanently wet', disabled: true },
];

test('the legend names the group and every box is named by its own label', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Growing conditions',
    options: CONDITIONS,
  });

  await expect
    .element(screen.getByRole('group', { name: /Growing conditions/ }))
    .toBeInTheDocument();
  expect(screen.getByRole('checkbox').elements()).toHaveLength(3);
  await expect.element(screen.getByRole('checkbox', { name: 'Full sun' })).toBeInTheDocument();
});

test('values decides which boxes start ticked', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Growing conditions',
    options: CONDITIONS,
    values: ['part-shade'],
  });

  await expect.element(screen.getByRole('checkbox', { name: 'Part shade' })).toBeChecked();
  await expect.element(screen.getByRole('checkbox', { name: 'Full sun' })).not.toBeChecked();
});

test('ticking and unticking rewrite the checked set', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Growing conditions',
    options: CONDITIONS,
    values: ['part-shade'],
  });

  const sun = screen.getByRole('checkbox', { name: 'Full sun' });
  const shade = screen.getByRole('checkbox', { name: 'Part shade' });

  await userEvent.click(sun);
  await expect.element(sun).toBeChecked();
  await expect.element(shade).toBeChecked();

  await userEvent.click(shade);
  await expect.element(shade).not.toBeChecked();
  await expect.element(sun).toBeChecked();
});

test('the shared name makes it one multi-value field, and a disabled option stays disabled', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Growing conditions',
    options: CONDITIONS,
    name: 'conditions',
  });

  await expect
    .element(screen.getByRole('checkbox', { name: 'Full sun' }))
    .toHaveAttribute('name', 'conditions');
  await expect.element(screen.getByRole('checkbox', { name: 'Permanently wet' })).toBeDisabled();
});

test('the group carries the hint and the errors, not each box', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Growing conditions',
    options: CONDITIONS,
    hint: 'Tick everything this plant tolerates.',
    errors: ['Choose at least one condition.'],
  });

  const group = screen.getByRole('group', { name: /Growing conditions/ }).element();
  expect((group.getAttribute('aria-describedby') ?? '').split(' ')).toHaveLength(2);
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose at least one');
});
