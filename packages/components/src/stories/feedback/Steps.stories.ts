import type { Meta, StoryObj } from '@storybook/sveltekit';
import Steps from '../../lib/feedback/Steps.svelte';
import type { StepItem } from '../../lib/feedback/Steps.svelte';

const season: StepItem[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'sow', label: 'Sow' },
  { id: 'transplant', label: 'Transplant' },
  { id: 'harvest', label: 'Harvest' },
];

/**
 * The stages of a short, fixed flow. Each step reads its state as text
 * ("Sow, Completed"); the number or glyph is decorative, and the current
 * step is `aria-current="step"`.
 */
const meta = {
  title: 'Feedback/Steps',
  component: Steps,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical', 'responsive'] },
  },
  args: { items: season, label: 'Season progress', current: 1 },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const Vertical: Story = { args: { orientation: 'vertical' } };

/** A column on a phone, a row from `sm` up. */
export const Responsive: Story = { args: { orientation: 'responsive' } };

/** An explicit `state` overrides the one derived from `current`. */
export const ErrorStep: Story = {
  args: {
    current: 2,
    items: season.map((step) => (step.id === 'transplant' ? { ...step, state: 'error' } : step)),
  },
};

/** Steps with an `href` are links, for a wizard whose earlier steps can be revisited. */
export const LinkMode: Story = {
  args: {
    label: 'Checkout progress',
    current: undefined,
    items: [
      { id: 'cart', label: 'Cart', state: 'complete', href: '/checkout/cart' },
      { id: 'address', label: 'Address', state: 'complete', href: '/checkout/address' },
      { id: 'payment', label: 'Payment', state: 'current', href: '/checkout/payment' },
      { id: 'review', label: 'Review', state: 'upcoming' },
    ],
  },
};
