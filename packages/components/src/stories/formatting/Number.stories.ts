import type { Meta, StoryObj } from '@storybook/sveltekit';
import NumberFormat from '../../lib/formatting/Number.svelte';

const meta = {
  title: 'Formatting/NumberFormat',
  component: NumberFormat,
  parameters: {
    docs: {
      description: {
        component: 'A `<data>` element: locale-formatted text, machine-readable `value` attribute.',
      },
    },
  },
} satisfies Meta<typeof NumberFormat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Decimal: Story = {
  args: { value: 1234.5, locales: 'en-AU' },
};

export const Currency: Story = {
  args: { value: 42.5, style: 'currency', currency: 'AUD', locales: 'en-AU' },
};

export const Percent: Story = {
  args: { value: 0.734, style: 'percent', locales: 'en-AU' },
};

export const Unit: Story = {
  args: { value: 12, style: 'unit', unit: 'kilometer', unitDisplay: 'long', locales: 'en-AU' },
};

export const SignDisplay: Story = {
  args: { value: 42, signDisplay: 'always', locales: 'en-AU' },
};

export const GermanLocale: Story = {
  args: { value: 1234.5, style: 'currency', currency: 'EUR', locales: 'de-DE' },
};
