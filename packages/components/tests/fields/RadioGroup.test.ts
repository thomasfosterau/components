import { userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RadioGroup from '../../src/lib/fields/RadioGroup.svelte';

const VISIBILITY = [
  { value: 'public', label: 'Anyone' },
  { value: 'followers', label: 'Followers' },
  { value: 'private', label: 'Only me' },
];

test('the legend names the radiogroup, which bits-ui renders', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Who can see this garden',
    options: VISIBILITY,
  });

  await expect
    .element(screen.getByRole('radiogroup', { name: /Who can see this garden/ }))
    .toBeInTheDocument();
  expect(screen.getByRole('radio').elements()).toHaveLength(3);
});

test('the chosen value is the checked radio', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Who can see this garden',
    options: VISIBILITY,
    value: 'followers',
  });

  await expect.element(screen.getByRole('radio', { name: 'Followers' })).toBeChecked();
  await expect.element(screen.getByRole('radio', { name: 'Anyone' })).not.toBeChecked();
});

test('the group is ONE tab stop, and the arrow keys move within it', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Who can see this garden',
    options: VISIBILITY,
    value: 'public',
  });

  await userEvent.tab();
  await expect.element(screen.getByRole('radio', { name: 'Anyone' })).toHaveFocus();

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('radio', { name: 'Followers' })).toHaveFocus();
  await expect.element(screen.getByRole('radio', { name: 'Followers' })).toBeChecked();

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('radio', { name: 'Only me' })).toBeChecked();

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(screen.getByRole('radio', { name: 'Followers' })).toBeChecked();
});

test('Tab leaves the group rather than walking through it', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Who can see this garden',
    options: VISIBILITY,
    value: 'public',
  });

  await userEvent.tab();
  await expect.element(screen.getByRole('radio', { name: 'Anyone' })).toHaveFocus();

  await userEvent.tab();
  await expect.element(screen.getByRole('radio', { name: 'Followers' })).not.toHaveFocus();
  await expect.element(screen.getByRole('radio', { name: 'Only me' })).not.toHaveFocus();
});

test('the hint and the errors describe the radiogroup, and required marks it', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Who can see this garden',
    options: VISIBILITY,
    hint: 'You can change this at any time.',
    errors: ['Choose who can see this garden.'],
    required: true,
  });

  const group = screen.getByRole('radiogroup', { name: /Who can see this garden/ }).element();
  expect((group.getAttribute('aria-describedby') ?? '').split(' ')).toHaveLength(2);
  expect(group.getAttribute('aria-required')).toBe('true');
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose who can see');
});

test('bare strings become options, and a horizontal group says so', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Sort by',
    options: ['Newest', 'Oldest'],
    orientation: 'horizontal',
    value: 'Newest',
  });

  const group = screen.getByRole('radiogroup', { name: /Sort by/ });
  await expect.element(group).toHaveAttribute('aria-orientation', 'horizontal');
  await expect.element(screen.getByRole('radio', { name: 'Newest' })).toBeChecked();
});
