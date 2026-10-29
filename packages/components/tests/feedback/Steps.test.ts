/**
 * `Steps` — the stages of a flow. State is text, never colour alone; the
 * marker is `aria-hidden`; exactly one step is `aria-current="step"`.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Steps from '../../src/lib/feedback/Steps.svelte';
import type { StepItem } from '../../src/lib/feedback/Steps.svelte';
import StepsFixture from './fixtures/StepsFixture.svelte';

const items: StepItem[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'sow', label: 'Sow' },
  { id: 'transplant', label: 'Transplant' },
  { id: 'harvest', label: 'Harvest' },
];

test('an ordered list named by label, one item per step', async () => {
  const screen = await render(Steps, { items, label: 'Checkout progress', current: 1 });

  const list = screen.getByRole('list', { name: 'Checkout progress' });
  await expect.element(list).toBeInTheDocument();
  expect(list.element().tagName).toBe('OL');
  expect(list.getByRole('listitem').elements()).toHaveLength(4);
});

test('state is read as text; the marker is hidden from the name', async () => {
  const screen = await render(Steps, { items, label: 'Progress', current: 1 });

  const [plan, sow, transplant] = screen.getByRole('listitem').elements();
  expect(plan?.textContent?.replace(/\s+/g, ' ').trim()).toContain('Plan, Completed');
  expect(sow?.textContent).toContain('Sow, Current step');
  expect(transplant?.textContent).toContain('Transplant, Not started');
  for (const icon of screen.container.querySelectorAll('.step-icon')) {
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  }
});

test('exactly one step is aria-current="step", on the li without links', async () => {
  const screen = await render(Steps, { items, label: 'Progress', current: 2 });

  const currents = screen.container.querySelectorAll('[aria-current="step"]');
  expect(currents).toHaveLength(1);
  expect(currents[0]?.tagName).toBe('LI');
  expect(currents[0]?.textContent).toContain('Transplant');
});

test('an explicit error state overrides the derived one', async () => {
  const withError: StepItem[] = items.map((step) =>
    step.id === 'sow' ? { ...step, state: 'error' } : step,
  );
  const screen = await render(Steps, { items: withError, label: 'Progress', current: 2 });

  const sow = screen.getByRole('listitem').nth(1);
  await expect.element(sow).toHaveClass('step-error');
  expect(sow.element().textContent).toContain('Sow, Error');
  expect(sow.element().querySelector('.step-icon')?.textContent?.trim()).toBe('✕');
});

test('link mode: only steps with href are links, resolved through the context', async () => {
  const screen = await render(StepsFixture, {
    items: [
      { id: 'plan', label: 'Plan', state: 'complete', href: '/plan' },
      { id: 'sow', label: 'Sow', state: 'current', href: '/sow' },
      { id: 'harvest', label: 'Harvest', state: 'upcoming' },
    ],
  });

  const plan = screen.getByRole('link', { name: /Plan/ });
  await expect.element(plan).toHaveAttribute('href', '/app/plan');
  await expect
    .element(screen.getByRole('link', { name: /Sow/ }))
    .toHaveAttribute('aria-current', 'step');
  expect(screen.getByRole('link').elements()).toHaveLength(2);
  expect(screen.container.querySelectorAll('li[aria-current]')).toHaveLength(0);
});

test('orientation and tone come from the literal tables; class merges last', async () => {
  const screen = await render(Steps, {
    items,
    label: 'Progress',
    current: 1,
    orientation: 'responsive',
    tone: 'success',
    class: 'w-full',
  });

  const list = screen.getByRole('list').element();
  expect(list.className).toContain('steps-vertical sm:steps-horizontal');
  expect([...list.classList].at(-1)).toBe('w-full');
  await expect.element(screen.getByRole('listitem').first()).toHaveClass('step-success');
  await expect.element(screen.getByRole('listitem').last()).not.toHaveClass('step-success');
});

test('renders right to left without overflowing', async () => {
  const screen = await render(StepsFixture, { items, dir: 'rtl' });

  const list = screen.getByRole('list').element() as HTMLElement;
  expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
});
