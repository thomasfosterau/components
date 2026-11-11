import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CheckboxGroup from '../../src/lib/fields/CheckboxGroup.svelte';
import CheckboxMixedFixture from './fixtures/CheckboxMixedFixture.svelte';

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

test('selectAll: the parent follows its children, and ticks or clears the enabled ones', async () => {
  const screen = await render(CheckboxMixedFixture, {});

  const parent = screen.getByRole('checkbox', { name: 'All vegetables' });
  await expect.element(parent).not.toBeChecked();
  await expect.element(parent).not.toBePartiallyChecked();

  await userEvent.click(screen.getByRole('checkbox', { name: 'Kale' }));
  await expect.element(parent).toBePartiallyChecked();

  await userEvent.click(parent);
  await expect.element(parent).toBeChecked();
  await expect.element(screen.getByTestId('values')).toHaveTextContent('Kale|Leek');
  // The disabled option is never touched.
  await expect.element(screen.getByRole('checkbox', { name: 'Okra' })).not.toBeChecked();

  await userEvent.click(parent);
  await expect.element(parent).not.toBeChecked();
  await expect.element(screen.getByTestId('values')).toHaveTextContent(/^$/);
});

test('selectAll: the parent controls the options and is never submitted', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(CheckboxMixedFixture, { onSubmitted });

  const parent = screen.getByRole('checkbox', { name: 'All vegetables' });
  const controlled = (parent.element().getAttribute('aria-controls') ?? '').split(' ');
  expect(controlled.map((id) => document.getElementById(id)?.getAttribute('value'))).toEqual([
    'Kale',
    'Leek',
    'Okra',
  ]);

  await userEvent.click(parent);
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  const data = onSubmitted.mock.calls[0]?.[0];
  expect(data?.getAll('veg')).toEqual(['Kale', 'Leek']);
  expect([...(data?.keys() ?? [])]).toEqual(['veg', 'veg']);
});
