import type { Meta, StoryObj } from '@storybook/sveltekit';
import ByteSize from '../../lib/formatting/ByteSize.svelte';

const meta = {
  title: 'Formatting/ByteSize',
  component: ByteSize,
  parameters: {
    docs: {
      description: {
        component:
          'A byte count in the largest sensible unit, as `<data value>`. `style="file"` is SI (1000, kB/MB); `style="memory"` is IEC (1024, KiB/MiB). The short unit is read in full ("4.2 megabytes").',
      },
    },
  },
} satisfies Meta<typeof ByteSize>;

export default meta;

type Story = StoryObj<typeof meta>;

export const File: Story = { args: { bytes: 4_200_000, locales: 'en-AU' } };

export const German: Story = { args: { bytes: 4_200_000, locales: 'de-DE' } };

export const Memory: Story = {
  args: { bytes: 1_610_612_736, style: 'memory', locales: 'en-AU' },
};

export const WithExactCount: Story = {
  args: { bytes: 4_200_000, includeExact: true, locales: 'en-AU' },
};

export const OnlyMegabytes: Story = {
  args: { bytes: 500_000, allowedUnits: ['megabyte'], locales: 'en-AU' },
};
