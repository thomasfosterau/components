import type { Meta, StoryObj } from '@storybook/sveltekit';
import RelativeTime from '../../lib/formatting/RelativeTime.svelte';

const NOW = new Date('2026-09-17T12:00:00Z');

const meta = {
  title: 'Formatting/RelativeTime',
  component: RelativeTime,
  args: { now: NOW, locales: 'en-AU' },
  parameters: {
    docs: {
      description: {
        component:
          'Picks the largest `Intl.RelativeTimeFormat` unit (seconds → years); the absolute instant is always in `datetime` and `title`.',
      },
    },
  },
} satisfies Meta<typeof RelativeTime>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecondsAgo: Story = {
  args: { value: new Date(NOW.getTime() - 30_000) },
};

export const HoursAgo: Story = {
  args: { value: new Date(NOW.getTime() - 3 * 60 * 60 * 1000) },
};

export const DaysFromNow: Story = {
  args: { value: new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000) },
};

export const YearsAgo: Story = {
  args: { value: new Date(NOW.getTime() - 3 * 365.25 * 24 * 60 * 60 * 1000) },
};

export const NumericAlways: Story = {
  args: { value: new Date(NOW.getTime() - 24 * 60 * 60 * 1000), numeric: 'always' },
};

export const GermanLocale: Story = {
  args: { value: new Date(NOW.getTime() - 3 * 60 * 60 * 1000), locales: 'de-DE' },
};
