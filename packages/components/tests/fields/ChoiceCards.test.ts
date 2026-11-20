import { userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CheckboxGroup from '../../src/lib/fields/CheckboxGroup.svelte';
import RadioGroup from '../../src/lib/fields/RadioGroup.svelte';
import ChoiceCardsFormFixture from './fixtures/ChoiceCardsFormFixture.svelte';
import RadioCardLinkFixture from './fixtures/RadioCardLinkFixture.svelte';

const PLANS = [
  { value: 'free', label: 'Free', description: 'One garden, ten plants.' },
  { value: 'pro', label: 'Pro', description: 'Unlimited gardens.' },
];

afterEach(() => {
  vi.restoreAllMocks();
});

test('a radio card is named by its title and described by its description', async () => {
  const screen = await render(RadioGroup, { legend: 'Plan', variant: 'cards', options: PLANS });

  await expect.element(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
  const free = screen.getByRole('radio', { name: 'Free', exact: true });
  await expect.element(free).toHaveAccessibleDescription('One garden, ten plants.');
  expect(screen.getByRole('radio').elements()).toHaveLength(2);
});

test('the radio cards are one tab stop, and the arrow keys choose', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Plan',
    variant: 'cards',
    options: PLANS,
    value: 'free',
  });

  await userEvent.tab();
  await expect.element(screen.getByRole('radio', { name: 'Free' })).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  const pro = screen.getByRole('radio', { name: 'Pro' });
  await expect.element(pro).toHaveFocus();
  await expect.element(pro).toBeChecked();
});

test('the check badge shows on the chosen card even with the marker hidden', async () => {
  const screen = await render(RadioGroup, {
    legend: 'Plan',
    variant: 'cards',
    indicator: 'hidden',
    options: PLANS,
    value: 'pro',
  });

  const pro = screen.getByRole('radio', { name: 'Pro' }).element();
  const free = screen.getByRole('radio', { name: 'Free' }).element();
  expect(pro.querySelector('.badge')).not.toBeNull();
  expect(free.querySelector('.badge')).toBeNull();
  expect(pro.querySelector('.rounded-full')).toBeNull();
});

test('a checkbox card is named by its title, and clicking the tile toggles it', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Beds',
    variant: 'cards',
    options: [{ value: 'raised', label: 'Raised bed', description: 'Drains well.' }],
  });

  const box = screen.getByRole('checkbox', { name: 'Raised bed', exact: true });
  await expect.element(box).toHaveAccessibleDescription('Drains well.');
  await screen.getByText('Drains well.').click();
  await expect.element(box).toBeChecked();
});

test('a hidden checkbox still takes focus and Space', async () => {
  const screen = await render(CheckboxGroup, {
    legend: 'Beds',
    variant: 'cards',
    indicator: 'hidden',
    options: ['Raised bed'],
  });

  await userEvent.tab();
  const box = screen.getByRole('checkbox', { name: 'Raised bed' });
  await expect.element(box).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect.element(box).toBeChecked();
});

test('cards post their values with the form', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(ChoiceCardsFormFixture, { onSubmitted });

  await screen.getByRole('radio', { name: 'Pro' }).click();
  await screen.getByRole('checkbox', { name: 'Containers' }).click();
  await screen.getByRole('button', { name: 'Save' }).click();

  const data = onSubmitted.mock.calls[0]?.[0];
  expect(data?.get('plan')).toBe('pro');
  expect(data?.getAll('beds')).toEqual(['pots']);
});

test('a focusable element inside a radio card warns in development', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await render(RadioCardLinkFixture);

  await vi.waitFor(() => {
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[RadioGroup]'));
  });
});
