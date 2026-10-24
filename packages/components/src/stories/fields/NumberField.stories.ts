import type { Meta, StoryObj } from '@storybook/sveltekit';
import NumberField from '../../lib/fields/NumberField.svelte';

const meta = {
  title: 'Fields/NumberField',
  component: NumberField,
  args: { 'aria-label': 'Plant count', value: 12, locales: 'en-AU' },
  parameters: {
    docs: {
      description: {
        component:
          'An exact number shown through `Intl.NumberFormat` (units, percent, currency, grouping) and parsed back in the same locale, with − / + buttons and APG spinbutton keys. Hold a button to auto-repeat. Inside a form, pass `FormField`’s `FieldControl` by spread instead of `aria-label`.',
      },
    },
  },
} satisfies Meta<typeof NumberField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Unit: Story = {
  args: {
    'aria-label': 'Bed width',
    value: 1.2,
    step: 0.1,
    formatOptions: { style: 'unit', unit: 'meter', maximumFractionDigits: 2 },
  },
};

export const Percent: Story = {
  args: {
    'aria-label': 'Germination rate',
    value: 0.45,
    step: 0.01,
    min: 0,
    max: 1,
    formatOptions: { style: 'percent' },
  },
};

export const Currency: Story = {
  args: {
    'aria-label': 'Price',
    value: 19.95,
    step: 0.05,
    min: 0,
    formatOptions: { style: 'currency', currency: 'AUD' },
  },
};

export const German: Story = {
  args: { 'aria-label': 'Fläche', value: 1234.5, locales: 'de-DE', step: 0.5 },
};

export const Bounds: Story = {
  args: { 'aria-label': 'Seeds per cell', value: 5, min: 1, max: 5 },
};

export const Invalid: Story = {
  args: { 'aria-label': 'Plant count', value: 0, invalid: true },
};
